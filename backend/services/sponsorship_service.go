package services

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
)

type SponsorshipService interface {
	CreateSponsorship(req *CreateSponsorshipRequest) (*models.Sponsorship, error)
	GetSponsorship(id uint) (*models.Sponsorship, error)
	GetSponsorshipsByEvent(eventID uint) ([]models.Sponsorship, error)
	GetSponsorshipsBySponsor(sponsorID uint) ([]models.Sponsorship, error)
	ApproveSponsorship(id uint, organizerAddress string) (*models.Sponsorship, error)
	RejectSponsorship(id uint, organizerAddress string) (*models.Sponsorship, error)
	UpdateDepositStatus(id uint, txHash string) (*models.Sponsorship, error)
	DeleteSponsorship(id uint) error
}

type sponsorshipService struct {
	sponsorshipRepo repositories.SponsorshipRepository
	eventRepo       repositories.EventRepository
	sponsorRepo     repositories.SponsorRepository
}

func NewSponsorshipService(
	sponsorshipRepo repositories.SponsorshipRepository,
	eventRepo repositories.EventRepository,
	sponsorRepo repositories.SponsorRepository,
) SponsorshipService {
	return &sponsorshipService{
		sponsorshipRepo: sponsorshipRepo,
		eventRepo:       eventRepo,
		sponsorRepo:     sponsorRepo,
	}
}

type CreateSponsorshipRequest struct {
	EventID       uint             `json:"event_id" binding:"required"`
	SponsorID     uint             `json:"sponsor_id" binding:"required"`
	AssetType     models.AssetType `json:"asset_type" binding:"required"`
	TokenAddress  string           `json:"token_address"` // ERC20 address or NFT contract
	TokenID       string           `json:"token_id"`      // NFT token ID
	Amount        string           `json:"amount" binding:"required"`
	AmountDisplay string           `json:"amount_display"`
	VotingWeight  string           `json:"voting_weight"` // e.g., "1 USDC = 1 vote"
	VotingPower   float64          `json:"voting_power"`  // numeric multiplier for sponsor voting
	Benefits      string           `json:"benefits"`
}

func (s *sponsorshipService) CreateSponsorship(req *CreateSponsorshipRequest) (*models.Sponsorship, error) {
	// Validate event exists
	_, err := s.eventRepo.GetByID(req.EventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	// Validate sponsor exists
	_, err = s.sponsorRepo.GetByID(req.SponsorID)
	if err != nil {
		return nil, errors.New("sponsor not found")
	}

	// Validate asset type
	validAssetTypes := []models.AssetType{
		models.AssetTypeERC20,
		models.AssetTypeNative,
		models.AssetTypeNFT,
	}
	isValid := false
	for _, validType := range validAssetTypes {
		if req.AssetType == validType {
			isValid = true
			break
		}
	}
	if !isValid {
		return nil, errors.New("invalid asset type")
	}

	sponsorship := &models.Sponsorship{
		EventID:       req.EventID,
		SponsorID:     req.SponsorID,
		AssetType:     req.AssetType,
		TokenAddress:  req.TokenAddress,
		TokenID:       req.TokenID,
		Amount:        req.Amount,
		AmountDisplay: req.AmountDisplay,
		Status:        models.SponsorshipStatusPending,
		VotingWeight:  req.VotingWeight,
		VotingPower:   req.VotingPower,
		Benefits:      req.Benefits,
	}

	err = s.sponsorshipRepo.Create(sponsorship)
	if err != nil {
		return nil, err
	}

	return sponsorship, nil
}

func (s *sponsorshipService) GetSponsorship(id uint) (*models.Sponsorship, error) {
	return s.sponsorshipRepo.GetByID(id)
}

func (s *sponsorshipService) GetSponsorshipsByEvent(eventID uint) ([]models.Sponsorship, error) {
	return s.sponsorshipRepo.GetByEventID(eventID)
}

func (s *sponsorshipService) GetSponsorshipsBySponsor(sponsorID uint) ([]models.Sponsorship, error) {
	return s.sponsorshipRepo.GetBySponsorID(sponsorID)
}

func (s *sponsorshipService) ApproveSponsorship(id uint, organizerAddress string) (*models.Sponsorship, error) {
	sponsorship, err := s.sponsorshipRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Verify organizer
	event, err := s.eventRepo.GetByID(sponsorship.EventID)
	if err != nil {
		return nil, err
	}

	if event.OrganizerAddress != organizerAddress {
		return nil, errors.New("only organizer can approve sponsorship")
	}

	sponsorship.Status = models.SponsorshipStatusApproved
	err = s.sponsorshipRepo.Update(sponsorship)
	if err != nil {
		return nil, err
	}

	return sponsorship, nil
}

func (s *sponsorshipService) RejectSponsorship(id uint, organizerAddress string) (*models.Sponsorship, error) {
	sponsorship, err := s.sponsorshipRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Verify organizer
	event, err := s.eventRepo.GetByID(sponsorship.EventID)
	if err != nil {
		return nil, err
	}

	if event.OrganizerAddress != organizerAddress {
		return nil, errors.New("only organizer can reject sponsorship")
	}

	sponsorship.Status = models.SponsorshipStatusRejected
	err = s.sponsorshipRepo.Update(sponsorship)
	if err != nil {
		return nil, err
	}

	return sponsorship, nil
}

func (s *sponsorshipService) UpdateDepositStatus(id uint, txHash string) (*models.Sponsorship, error) {
	sponsorship, err := s.sponsorshipRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if sponsorship.Status != models.SponsorshipStatusApproved {
		return nil, errors.New("sponsorship must be approved before deposit")
	}

	sponsorship.Status = models.SponsorshipStatusDeposited
	sponsorship.DepositTxHash = txHash
	err = s.sponsorshipRepo.Update(sponsorship)
	if err != nil {
		return nil, err
	}

	return sponsorship, nil
}

func (s *sponsorshipService) DeleteSponsorship(id uint) error {
	return s.sponsorshipRepo.Delete(id)
}
