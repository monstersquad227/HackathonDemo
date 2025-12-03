package services

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
)

type RegistrationService interface {
	CreateRegistration(req *CreateRegistrationRequest) (*models.Registration, error)
	GetRegistration(id uint) (*models.Registration, error)
	GetRegistrationsByEvent(eventID uint) ([]models.Registration, error)
	GetRegistrationsByTeam(teamID uint) ([]models.Registration, error)
	ApproveRegistration(id uint, organizerAddress string) (*models.Registration, error)
	RejectRegistration(id uint, organizerAddress string) (*models.Registration, error)
	UpdateSBTStatus(id uint, tokenID uint64, txHash string) (*models.Registration, error)
	DeleteRegistration(id uint) error
}

type registrationService struct {
	registrationRepo repositories.RegistrationRepository
	teamRepo         repositories.TeamRepository
	eventRepo       repositories.EventRepository
}

func NewRegistrationService(
	registrationRepo repositories.RegistrationRepository,
	teamRepo repositories.TeamRepository,
	eventRepo repositories.EventRepository,
) RegistrationService {
	return &registrationService{
		registrationRepo: registrationRepo,
		teamRepo:         teamRepo,
		eventRepo:        eventRepo,
	}
}

type CreateRegistrationRequest struct {
	EventID            uint   `json:"event_id"` // Required, validated in controller
	TeamID             *uint  `json:"team_id,omitempty"` // Optional: for team registration
	WalletAddress      string `json:"wallet_address,omitempty"` // Required if TeamID is not provided, validated in service
	ProjectName        string `json:"project_name,omitempty"`
	ProjectDescription string `json:"project_description,omitempty"`
}

func (s *registrationService) CreateRegistration(req *CreateRegistrationRequest) (*models.Registration, error) {
	// Validate event exists
	event, err := s.eventRepo.GetByID(req.EventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	// Check if event is in registration stage
	if event.CurrentStage != models.StageRegistration {
		return nil, errors.New("event is not in registration stage")
	}

	// Check if registration limit is reached
	approvedCount, err := s.registrationRepo.CountApprovedByEventID(req.EventID)
	if err != nil {
		return nil, err
	}
	if int64(event.MaxParticipants) > 0 && approvedCount >= int64(event.MaxParticipants) {
		return nil, errors.New("报名人数已满")
	}

	// Validate that either TeamID or WalletAddress is provided
	if req.TeamID == nil && req.WalletAddress == "" {
		return nil, errors.New("either team_id or wallet_address must be provided")
	}

	var registration *models.Registration

	// Handle team registration
	if req.TeamID != nil {
		// Validate team exists
		team, err := s.teamRepo.GetByID(*req.TeamID)
		if err != nil {
			return nil, errors.New("team not found")
		}

		// Check if team is approved
		if team.Status != models.TeamStatusApproved {
			return nil, errors.New("team must be approved before registration")
		}

		// Check if already registered
		existing, _ := s.registrationRepo.GetByEventAndTeam(req.EventID, *req.TeamID)
		if existing != nil {
			return nil, errors.New("team already registered for this event")
		}

		registration = &models.Registration{
			EventID:            req.EventID,
			TeamID:             req.TeamID,
			Status:             models.RegistrationStatusPending,
			ProjectName:        req.ProjectName,
			ProjectDescription: req.ProjectDescription,
		}
	} else {
		// Handle individual registration by wallet address
		// Check if wallet address already registered for this event
		existing, _ := s.registrationRepo.GetByEventAndWallet(req.EventID, req.WalletAddress)
		if existing != nil {
			return nil, errors.New("wallet address already registered for this event")
		}

		registration = &models.Registration{
			EventID:            req.EventID,
			TeamID:             nil,
			WalletAddress:      req.WalletAddress,
			Status:             models.RegistrationStatusPending,
			ProjectName:        req.ProjectName,
			ProjectDescription: req.ProjectDescription,
		}
	}

	err = s.registrationRepo.Create(registration)
	if err != nil {
		return nil, err
	}

	return registration, nil
}

func (s *registrationService) GetRegistration(id uint) (*models.Registration, error) {
	return s.registrationRepo.GetByID(id)
}

func (s *registrationService) GetRegistrationsByEvent(eventID uint) ([]models.Registration, error) {
	return s.registrationRepo.GetByEventID(eventID)
}

func (s *registrationService) GetRegistrationsByTeam(teamID uint) ([]models.Registration, error) {
	return s.registrationRepo.GetByTeamID(teamID)
}

func (s *registrationService) ApproveRegistration(id uint, organizerAddress string) (*models.Registration, error) {
	registration, err := s.registrationRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Verify organizer
	event, err := s.eventRepo.GetByID(registration.EventID)
	if err != nil {
		return nil, err
	}

	if event.OrganizerAddress != organizerAddress {
		return nil, errors.New("only organizer can approve registration")
	}

	// Check if registration limit is reached before approving
	approvedCount, err := s.registrationRepo.CountApprovedByEventID(registration.EventID)
	if err != nil {
		return nil, err
	}
	if int64(event.MaxParticipants) > 0 && approvedCount >= int64(event.MaxParticipants) {
		return nil, errors.New("报名人数已满，无法批准更多报名")
	}

	registration.Status = models.RegistrationStatusApproved
	err = s.registrationRepo.Update(registration)
	if err != nil {
		return nil, err
	}

	return registration, nil
}

func (s *registrationService) RejectRegistration(id uint, organizerAddress string) (*models.Registration, error) {
	registration, err := s.registrationRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Verify organizer
	event, err := s.eventRepo.GetByID(registration.EventID)
	if err != nil {
		return nil, err
	}

	if event.OrganizerAddress != organizerAddress {
		return nil, errors.New("only organizer can reject registration")
	}

	registration.Status = models.RegistrationStatusRejected
	err = s.registrationRepo.Update(registration)
	if err != nil {
		return nil, err
	}

	return registration, nil
}

func (s *registrationService) UpdateSBTStatus(id uint, tokenID uint64, txHash string) (*models.Registration, error) {
	registration, err := s.registrationRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if registration.Status != models.RegistrationStatusApproved {
		return nil, errors.New("registration must be approved before minting SBT")
	}

	registration.Status = models.RegistrationStatusSBTMinted
	registration.SBTTokenID = &tokenID
	registration.SBTTxHash = txHash
	err = s.registrationRepo.Update(registration)
	if err != nil {
		return nil, err
	}

	return registration, nil
}

func (s *registrationService) DeleteRegistration(id uint) error {
	return s.registrationRepo.Delete(id)
}

