package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

type CheckInService interface {
	GenerateQRCode(eventID uint) (*CheckInQRCodeResponse, error)
	VerifyAndCheckIn(req *CheckInRequest) (*models.CheckIn, error)
	GetCheckIn(id uint) (*models.CheckIn, error)
	GetCheckInsByEvent(eventID uint) ([]models.CheckIn, error)
	GetCheckInByUserAndEvent(userAddress string, eventID uint) (*models.CheckIn, error)
	GetCheckInCount(eventID uint) (int64, error)
	UpdateTxHash(id uint, txHash string) (*models.CheckIn, error)
	DeleteCheckIn(id uint) error
}

type checkInService struct {
	checkInRepo repositories.CheckInRepository
	eventRepo   repositories.EventRepository
	teamRepo    repositories.TeamRepository
}

func NewCheckInService(
	checkInRepo repositories.CheckInRepository,
	eventRepo repositories.EventRepository,
	teamRepo repositories.TeamRepository,
) CheckInService {
	return &checkInService{
		checkInRepo: checkInRepo,
		eventRepo:   eventRepo,
		teamRepo:    teamRepo,
	}
}

type CheckInQRCodeResponse struct {
	EventID   uint      `json:"event_id"`
	Message   string    `json:"message"`
	QRCode    string    `json:"qr_code"` // Base64 encoded QR code or URL
	ExpiresAt time.Time `json:"expires_at"`
}

type CheckInRequest struct {
	EventID     uint   `json:"event_id" binding:"required"`
	UserAddress string `json:"user_address" binding:"required"`
	Signature   string `json:"signature" binding:"required"`
	Message     string `json:"message" binding:"required"`
	TeamID      *uint  `json:"team_id"`
	IPAddress   string `json:"ip_address"`
	DeviceInfo  string `json:"device_info"`
}

func (s *checkInService) GenerateQRCode(eventID uint) (*CheckInQRCodeResponse, error) {
	// Validate event exists
	event, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	// Check if event is in check-in stage
	if event.CurrentStage != models.StageCheckIn {
		return nil, errors.New("event is not in check-in stage")
	}

	// Generate secret for signing
	secret := make([]byte, 32)
	_, err = rand.Read(secret)
	if err != nil {
		return nil, err
	}
	secretHex := hex.EncodeToString(secret)

	// Create message to sign
	message := fmt.Sprintf("Check-in for event %d\nEvent: %s\nSecret: %s\nTimestamp: %d",
		eventID, event.Name, secretHex, time.Now().Unix())

	expiresAt := time.Now().Add(30 * time.Minute) // QR code expires in 30 minutes

	// In a real implementation, you would generate QR code image here
	// For now, we'll return the message and let frontend generate QR code
	qrCodeData := fmt.Sprintf("event:%d|message:%s|expires:%d", eventID, message, expiresAt.Unix())

	return &CheckInQRCodeResponse{
		EventID:   eventID,
		Message:   message,
		QRCode:    qrCodeData,
		ExpiresAt: expiresAt,
	}, nil
}

func (s *checkInService) VerifyAndCheckIn(req *CheckInRequest) (*models.CheckIn, error) {
	// Validate event exists
	event, err := s.eventRepo.GetByID(req.EventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	// Check if event is in check-in stage
	if event.CurrentStage != models.StageCheckIn {
		return nil, errors.New("event is not in check-in stage")
	}

	// Check if already checked in
	existing, _ := s.checkInRepo.GetByUserAndEvent(req.UserAddress, req.EventID)
	if existing != nil {
		return nil, errors.New("user already checked in")
	}

	// Verify signature
	err = s.verifySignature(req.UserAddress, req.Message, req.Signature)
	if err != nil {
		return nil, fmt.Errorf("signature verification failed: %v", err)
	}

	// Validate team if provided
	if req.TeamID != nil {
		team, err := s.teamRepo.GetByID(*req.TeamID)
		if err != nil {
			return nil, errors.New("team not found")
		}
		// Verify user is member of team
		isMember := false
		if team.LeaderAddress == req.UserAddress {
			isMember = true
		} else {
			for _, member := range team.Members {
				if member.Address == req.UserAddress {
					isMember = true
					break
				}
			}
		}
		if !isMember {
			return nil, errors.New("user is not a member of the specified team")
		}
	}

	checkIn := &models.CheckIn{
		EventID:     req.EventID,
		UserAddress: req.UserAddress,
		TeamID:      req.TeamID,
		Signature:   req.Signature,
		Message:     req.Message,
		CheckInTime: time.Now(),
		IPAddress:   req.IPAddress,
		DeviceInfo:  req.DeviceInfo,
	}

	err = s.checkInRepo.Create(checkIn)
	if err != nil {
		return nil, err
	}

	return checkIn, nil
}

func (s *checkInService) verifySignature(address, message, signature string) error {
	// Remove 0x prefix if present
	if len(signature) > 2 && signature[:2] == "0x" {
		signature = signature[2:]
	}

	// Decode signature
	sigBytes, err := hexutil.Decode("0x" + signature)
	if err != nil {
		return err
	}

	// Ethereum signature recovery
	if len(sigBytes) != 65 {
		return errors.New("invalid signature length")
	}

	// Ethereum uses recovery ID v = 27 or 28
	if sigBytes[64] != 27 && sigBytes[64] != 28 {
		return errors.New("invalid recovery id")
	}

	// Create hash of message (Ethereum message prefix)
	msgHash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)))

	// Recover public key
	pubKey, err := crypto.SigToPub(msgHash.Bytes(), sigBytes)
	if err != nil {
		return err
	}

	// Get address from public key
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)

	// Compare addresses
	if common.HexToAddress(address) != recoveredAddr {
		return errors.New("signature does not match address")
	}

	return nil
}

func (s *checkInService) GetCheckIn(id uint) (*models.CheckIn, error) {
	return s.checkInRepo.GetByID(id)
}

func (s *checkInService) GetCheckInsByEvent(eventID uint) ([]models.CheckIn, error) {
	return s.checkInRepo.GetByEventID(eventID)
}

func (s *checkInService) GetCheckInByUserAndEvent(userAddress string, eventID uint) (*models.CheckIn, error) {
	return s.checkInRepo.GetByUserAndEvent(userAddress, eventID)
}

func (s *checkInService) GetCheckInCount(eventID uint) (int64, error) {
	return s.checkInRepo.CountByEventID(eventID)
}

func (s *checkInService) UpdateTxHash(id uint, txHash string) (*models.CheckIn, error) {
	checkIn, err := s.checkInRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	checkIn.TxHash = txHash
	err = s.checkInRepo.Update(checkIn)
	if err != nil {
		return nil, err
	}

	return checkIn, nil
}

func (s *checkInService) DeleteCheckIn(id uint) error {
	return s.checkInRepo.Delete(id)
}
