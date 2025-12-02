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
	EventID            uint   `json:"event_id" binding:"required"`
	TeamID             uint   `json:"team_id" binding:"required"`
	ProjectName        string `json:"project_name"`
	ProjectDescription string `json:"project_description"`
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

	// Validate team exists
	team, err := s.teamRepo.GetByID(req.TeamID)
	if err != nil {
		return nil, errors.New("team not found")
	}

	// Check if team is approved
	if team.Status != models.TeamStatusApproved {
		return nil, errors.New("team must be approved before registration")
	}

	// Check if already registered
	existing, _ := s.registrationRepo.GetByEventAndTeam(req.EventID, req.TeamID)
	if existing != nil {
		return nil, errors.New("team already registered for this event")
	}

	registration := &models.Registration{
		EventID:            req.EventID,
		TeamID:             req.TeamID,
		Status:             models.RegistrationStatusPending,
		ProjectName:        req.ProjectName,
		ProjectDescription: req.ProjectDescription,
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

