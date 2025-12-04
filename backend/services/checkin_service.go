package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
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
	TxHash      string `json:"tx_hash"` // Optional transaction hash
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
	log.Printf("[DEBUG] VerifyAndCheckIn called:")
	log.Printf("  - Event ID: %d", req.EventID)
	log.Printf("  - User Address: %s", req.UserAddress)
	log.Printf("  - Message length: %d", len(req.Message))
	log.Printf("  - Signature length: %d", len(req.Signature))
	log.Printf("  - Team ID: %v", req.TeamID)

	// Validate event exists
	event, err := s.eventRepo.GetByID(req.EventID)
	if err != nil {
		log.Printf("[ERROR] Event not found: %d", req.EventID)
		return nil, errors.New("event not found")
	}
	log.Printf("[DEBUG] Event found: %s (ID: %d)", event.Name, event.ID)

	// Check if event is in check-in stage
	if event.CurrentStage != models.StageCheckIn {
		log.Printf("[ERROR] Event is not in check-in stage. Current stage: %s", event.CurrentStage)
		return nil, errors.New("event is not in check-in stage")
	}
	log.Printf("[DEBUG] Event is in check-in stage")

	// Check if already checked in
	existing, _ := s.checkInRepo.GetByUserAndEvent(req.UserAddress, req.EventID)
	if existing != nil {
		log.Printf("[ERROR] User already checked in: %s (Check-in ID: %d)", req.UserAddress, existing.ID)
		return nil, errors.New("user already checked in")
	}
	log.Printf("[DEBUG] User has not checked in yet")

	// Verify message content first
	log.Printf("[DEBUG] Starting message content verification...")
	err = s.verifyMessageContent(req.Message, req.EventID, event.Name)
	if err != nil {
		log.Printf("[ERROR] Message content verification failed: %v", err)
		return nil, fmt.Errorf("message verification failed: %v", err)
	}
	log.Printf("[DEBUG] Message content verification passed")

	// Verify signature
	log.Printf("[DEBUG] Starting signature verification...")
	err = s.verifySignature(req.UserAddress, req.Message, req.Signature)
	if err != nil {
		log.Printf("[ERROR] Signature verification failed: %v", err)
		return nil, fmt.Errorf("signature verification failed: %v", err)
	}
	log.Printf("[DEBUG] Signature verification passed")

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
		TxHash:      req.TxHash, // Save transaction hash if provided
	}

	err = s.checkInRepo.Create(checkIn)
	if err != nil {
		return nil, err
	}

	return checkIn, nil
}

// verifyMessageContent validates the message format and content
func (s *checkInService) verifyMessageContent(message string, eventID uint, eventName string) error {
	log.Printf("[DEBUG] verifyMessageContent called:")
	log.Printf("  - Message: %s", message)
	log.Printf("  - Expected Event ID: %d", eventID)
	log.Printf("  - Expected Event Name: %s", eventName)

	// Parse message format: "Check-in for event {id}\nEvent: {name}\nSecret: {secret}\nTimestamp: {timestamp}"
	var parsedEventID uint
	var parsedEventName string
	var secret string
	var timestamp int64

	_, err := fmt.Sscanf(message, "Check-in for event %d\nEvent: %s\nSecret: %s\nTimestamp: %d",
		&parsedEventID, &parsedEventName, &secret, &timestamp)
	if err != nil {
		log.Printf("[ERROR] Failed to parse message format: %v", err)
		return fmt.Errorf("invalid message format: %v", err)
	}

	log.Printf("[DEBUG] Parsed message:")
	log.Printf("  - Event ID: %d", parsedEventID)
	log.Printf("  - Event Name: %s", parsedEventName)
	log.Printf("  - Secret: %s", secret)
	log.Printf("  - Timestamp: %d", timestamp)

	// Verify event ID matches
	if parsedEventID != eventID {
		log.Printf("[ERROR] Event ID mismatch: parsed=%d, expected=%d", parsedEventID, eventID)
		return fmt.Errorf("event ID mismatch: expected %d, got %d", eventID, parsedEventID)
	}

	// Verify event name matches
	if parsedEventName != eventName {
		log.Printf("[ERROR] Event name mismatch: parsed=%s, expected=%s", parsedEventName, eventName)
		return fmt.Errorf("event name mismatch: expected %s, got %s", eventName, parsedEventName)
	}

	// Verify secret format (should be 64 hex characters)
	if len(secret) != 64 {
		log.Printf("[ERROR] Invalid secret length: %d (expected 64)", len(secret))
		return fmt.Errorf("invalid secret format: expected 64 hex characters, got %d", len(secret))
	}

	// Verify secret is valid hex
	_, err = hex.DecodeString(secret)
	if err != nil {
		log.Printf("[ERROR] Invalid secret format (not hex): %v", err)
		return fmt.Errorf("invalid secret format: %v", err)
	}

	// Verify timestamp is within valid range (30 minutes)
	messageTime := time.Unix(timestamp, 0)
	now := time.Now()
	timeDiff := now.Sub(messageTime)
	maxAge := 30 * time.Minute

	if timeDiff < 0 {
		log.Printf("[ERROR] Message timestamp is in the future: %v", messageTime)
		return fmt.Errorf("message timestamp is in the future")
	}

	if timeDiff > maxAge {
		log.Printf("[ERROR] Message expired: age=%v, max=%v", timeDiff, maxAge)
		return fmt.Errorf("message expired: message is %v old, maximum age is %v", timeDiff, maxAge)
	}

	log.Printf("[DEBUG] Message content verification successful!")
	return nil
}

func (s *checkInService) verifySignature(address, message, signature string) error {
	log.Printf("[DEBUG] verifySignature called with:")
	log.Printf("  - Address: %s", address)
	log.Printf("  - Message length: %d", len(message))
	log.Printf("  - Message preview: %s...", message[:min(50, len(message))])
	log.Printf("  - Signature length: %d", len(signature))
	log.Printf("  - Signature: %s", signature)

	// Remove 0x prefix if present
	originalSignature := signature
	if len(signature) > 2 && signature[:2] == "0x" {
		signature = signature[2:]
		log.Printf("[DEBUG] Removed 0x prefix, signature length now: %d", len(signature))
	}

	// Decode signature
	sigBytes, err := hexutil.Decode("0x" + signature)
	if err != nil {
		log.Printf("[ERROR] Failed to decode signature: %v", err)
		return err
	}
	log.Printf("[DEBUG] Signature decoded successfully, length: %d bytes", len(sigBytes))

	// Ethereum signature recovery
	if len(sigBytes) != 65 {
		log.Printf("[ERROR] Invalid signature length: %d (expected 65)", len(sigBytes))
		return errors.New("invalid signature length")
	}

	// Extract signature components
	rComponent := sigBytes[0:32]
	sComponent := sigBytes[32:64]
	vComponent := sigBytes[64]
	log.Printf("[DEBUG] Signature components:")
	log.Printf("  - R: %s", hex.EncodeToString(rComponent))
	log.Printf("  - S: %s", hex.EncodeToString(sComponent))
	log.Printf("  - V (recovery ID): %d", vComponent)

	// Handle different recovery ID formats
	// ethers.js v6 may return v = 0 or 1, while traditional format uses v = 27 or 28
	originalRecoveryID := sigBytes[64]
	recoveryID := originalRecoveryID
	log.Printf("[DEBUG] Original recovery ID: %d", originalRecoveryID)
	
	// Normalize recovery ID to 27/28 format for validation
	normalizedRecoveryID := recoveryID
	if recoveryID < 27 {
		// ethers.js v6 uses 0/1 format, convert to 27/28 for validation
		normalizedRecoveryID = recoveryID + 27
		log.Printf("[DEBUG] Converted recovery ID from %d to %d for validation", originalRecoveryID, normalizedRecoveryID)
	}

	// Validate recovery ID is 27, 28, 0, or 1
	if normalizedRecoveryID != 27 && normalizedRecoveryID != 28 {
		log.Printf("[ERROR] Invalid recovery ID: %d (original: %d)", normalizedRecoveryID, originalRecoveryID)
		return fmt.Errorf("invalid recovery id: %d (expected 27, 28, 0, or 1, got %d)", normalizedRecoveryID, originalRecoveryID)
	}
	log.Printf("[DEBUG] Recovery ID validated: %d (normalized: %d)", originalRecoveryID, normalizedRecoveryID)

	// Create hash of message (Ethereum message prefix)
	// ethers.js signMessage automatically adds the prefix, so we need to match that format
	prefixedMessage := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	msgHash := crypto.Keccak256Hash([]byte(prefixedMessage))
	log.Printf("[DEBUG] Message hash:")
	log.Printf("  - Prefixed message length: %d", len(prefixedMessage))
	log.Printf("  - Message hash: %s", msgHash.Hex())

	// Prepare signature for SigToPub (it expects recovery ID 0 or 1, not 27 or 28)
	sigForRecovery := make([]byte, 65)
	copy(sigForRecovery, sigBytes)
	// Convert recovery ID to 0/1 format for SigToPub
	// If original is 27/28, convert to 0/1; if original is 0/1, keep as is
	if originalRecoveryID >= 27 {
		// 27 -> 0, 28 -> 1
		sigForRecovery[64] = originalRecoveryID - 27
		log.Printf("[DEBUG] Converted recovery ID from %d to %d for SigToPub", originalRecoveryID, sigForRecovery[64])
	} else {
		// Already in 0/1 format, keep as is
		sigForRecovery[64] = originalRecoveryID
		log.Printf("[DEBUG] Using original recovery ID %d for SigToPub", originalRecoveryID)
	}
	log.Printf("[DEBUG] Recovery ID for SigToPub: %d (original: %d)", sigForRecovery[64], originalRecoveryID)

	// Recover public key
	log.Printf("[DEBUG] Attempting to recover public key with recovery ID: %d", sigForRecovery[64])
	pubKey, err := crypto.SigToPub(msgHash.Bytes(), sigForRecovery)
	if err != nil {
		log.Printf("[ERROR] Failed to recover public key: %v", err)
		log.Printf("[ERROR] Details - Message hash: %s, Original Recovery ID: %d, SigToPub Recovery ID: %d", 
			msgHash.Hex(), originalRecoveryID, sigForRecovery[64])
		log.Printf("[ERROR] Signature R: %s", hex.EncodeToString(sigForRecovery[0:32]))
		log.Printf("[ERROR] Signature S: %s", hex.EncodeToString(sigForRecovery[32:64]))
		return fmt.Errorf("failed to recover public key: %v", err)
	}
	log.Printf("[DEBUG] Public key recovered successfully")

	// Get address from public key
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)
	log.Printf("[DEBUG] Recovered address: %s", recoveredAddr.Hex())

	// Compare addresses (case-insensitive)
	if !common.IsHexAddress(address) {
		log.Printf("[ERROR] Invalid address format: %s", address)
		return errors.New("invalid address format")
	}
	
	expectedAddr := common.HexToAddress(address)
	log.Printf("[DEBUG] Expected address: %s", expectedAddr.Hex())
	log.Printf("[DEBUG] Address comparison: recovered=%s, expected=%s, match=%v", 
		recoveredAddr.Hex(), expectedAddr.Hex(), recoveredAddr == expectedAddr)

	if recoveredAddr != expectedAddr {
		log.Printf("[ERROR] Address mismatch!")
		log.Printf("  - Recovered: %s", recoveredAddr.Hex())
		log.Printf("  - Expected: %s", expectedAddr.Hex())
		log.Printf("  - Original signature: %s", originalSignature)
		log.Printf("  - Message: %s", message)
		return fmt.Errorf("signature does not match address: recovered %s, expected %s", recoveredAddr.Hex(), expectedAddr.Hex())
	}

	log.Printf("[DEBUG] Signature verification successful!")
	return nil
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
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
