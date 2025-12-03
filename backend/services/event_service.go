package services

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
	"time"
)

type EventService interface {
	CreateEvent(req *CreateEventRequest) (*models.Event, error)
	GetEvent(id uint) (*models.Event, error)
	ListEvents() ([]models.Event, error)
	UpdateEvent(id uint, req *UpdateEventRequest) (*models.Event, error)
	DeleteEvent(id uint) error
	UpdateStage(id uint, stage models.EventStage) (*models.Event, error)
}

type eventService struct {
	repo repositories.EventRepository
}

func NewEventService(repo repositories.EventRepository) EventService {
	return &eventService{repo: repo}
}

type CreateEventRequest struct {
	Name                  string                 `json:"name" binding:"required"`
	Description           string                 `json:"description"`
	Location              string                 `json:"location"`
	StartTime             time.Time              `json:"start_time" binding:"required"`
	EndTime               time.Time              `json:"end_time" binding:"required"`
	RegistrationStartTime *time.Time             `json:"registration_start_time"`
	RegistrationEndTime   *time.Time             `json:"registration_end_time"`
	CheckInStartTime      *time.Time             `json:"checkin_start_time"`
	CheckInEndTime        *time.Time             `json:"checkin_end_time"`
	SubmissionStartTime   *time.Time             `json:"submission_start_time"`
	SubmissionEndTime     *time.Time             `json:"submission_end_time"`
	VotingStartTime       *time.Time             `json:"voting_start_time"`
	VotingEndTime         *time.Time             `json:"voting_end_time"`
	OrganizerAddress      string                 `json:"organizer_address" binding:"required"`
	AllowSponsorVoting    bool                   `json:"allow_sponsor_voting"`
	AllowPublicVoting     bool                   `json:"allow_public_voting"`
	OnChain               bool                   `json:"on_chain"`
	Prizes                []CreatePrizeRequest   `json:"prizes"`
}

type CreatePrizeRequest struct {
	Rank        int    `json:"rank" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Amount      string `json:"amount"`
	Count       int    `json:"count"` // Number of prizes for this rank
}

type UpdateEventRequest struct {
	Name                  *string                `json:"name"`
	Description           *string                `json:"description"`
	Location              *string                `json:"location"`
	StartTime             *time.Time             `json:"start_time"`
	EndTime               *time.Time             `json:"end_time"`
	RegistrationStartTime *time.Time             `json:"registration_start_time"`
	RegistrationEndTime   *time.Time             `json:"registration_end_time"`
	CheckInStartTime      *time.Time             `json:"checkin_start_time"`
	CheckInEndTime        *time.Time             `json:"checkin_end_time"`
	SubmissionStartTime   *time.Time             `json:"submission_start_time"`
	SubmissionEndTime     *time.Time             `json:"submission_end_time"`
	VotingStartTime       *time.Time             `json:"voting_start_time"`
	VotingEndTime         *time.Time             `json:"voting_end_time"`
	AllowSponsorVoting    *bool                  `json:"allow_sponsor_voting"`
	AllowPublicVoting     *bool                  `json:"allow_public_voting"`
	Prizes                []CreatePrizeRequest   `json:"prizes"`
}

func (s *eventService) CreateEvent(req *CreateEventRequest) (*models.Event, error) {
	// Validate time ranges
	if req.EndTime.Before(req.StartTime) {
		return nil, errors.New("end time must be after start time")
	}

	event := &models.Event{
		Name:                  req.Name,
		Description:           req.Description,
		Location:              req.Location,
		StartTime:             req.StartTime,
		EndTime:               req.EndTime,
		RegistrationStartTime: req.RegistrationStartTime,
		RegistrationEndTime:   req.RegistrationEndTime,
		CheckInStartTime:      req.CheckInStartTime,
		CheckInEndTime:        req.CheckInEndTime,
		SubmissionStartTime:   req.SubmissionStartTime,
		SubmissionEndTime:     req.SubmissionEndTime,
		VotingStartTime:       req.VotingStartTime,
		VotingEndTime:         req.VotingEndTime,
		CurrentStage:          models.StageRegistration,
		OrganizerAddress:      req.OrganizerAddress,
		AllowSponsorVoting:    req.AllowSponsorVoting,
		AllowPublicVoting:     req.AllowPublicVoting,
		OnChain:               req.OnChain,
	}

	// Create prizes
	for _, prizeReq := range req.Prizes {
		count := prizeReq.Count
		if count <= 0 {
			count = 1 // Default to 1 if not specified or invalid
		}
		prize := models.Prize{
			Rank:        prizeReq.Rank,
			Name:        prizeReq.Name,
			Description: prizeReq.Amount,      // 修复：交换字段，amount值存储到description
			Amount:      prizeReq.Description, // 修复：交换字段，description值存储到amount
			Count:       count,
		}
		event.Prizes = append(event.Prizes, prize)
	}

	err := s.repo.Create(event)
	if err != nil {
		return nil, err
	}

	return event, nil
}

func (s *eventService) GetEvent(id uint) (*models.Event, error) {
	return s.repo.GetByID(id)
}

func (s *eventService) ListEvents() ([]models.Event, error) {
	return s.repo.GetAll()
}

func (s *eventService) UpdateEvent(id uint, req *UpdateEventRequest) (*models.Event, error) {
	event, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		event.Name = *req.Name
	}
	if req.Description != nil {
		event.Description = *req.Description
	}
	if req.Location != nil {
		event.Location = *req.Location
	}
	if req.StartTime != nil {
		event.StartTime = *req.StartTime
	}
	if req.EndTime != nil {
		event.EndTime = *req.EndTime
	}
	if req.RegistrationStartTime != nil {
		event.RegistrationStartTime = req.RegistrationStartTime
	}
	if req.RegistrationEndTime != nil {
		event.RegistrationEndTime = req.RegistrationEndTime
	}
	if req.CheckInStartTime != nil {
		event.CheckInStartTime = req.CheckInStartTime
	}
	if req.CheckInEndTime != nil {
		event.CheckInEndTime = req.CheckInEndTime
	}
	if req.SubmissionStartTime != nil {
		event.SubmissionStartTime = req.SubmissionStartTime
	}
	if req.SubmissionEndTime != nil {
		event.SubmissionEndTime = req.SubmissionEndTime
	}
	if req.VotingStartTime != nil {
		event.VotingStartTime = req.VotingStartTime
	}
	if req.VotingEndTime != nil {
		event.VotingEndTime = req.VotingEndTime
	}
	if req.AllowSponsorVoting != nil {
		event.AllowSponsorVoting = *req.AllowSponsorVoting
	}
	if req.AllowPublicVoting != nil {
		event.AllowPublicVoting = *req.AllowPublicVoting
	}

	// Update prizes if provided
	if req.Prizes != nil {
		event.Prizes = []models.Prize{}
		for _, prizeReq := range req.Prizes {
			count := prizeReq.Count
			if count <= 0 {
				count = 1 // Default to 1 if not specified or invalid
			}
			prize := models.Prize{
				Rank:        prizeReq.Rank,
				Name:        prizeReq.Name,
				Description: prizeReq.Description,
				Amount:      prizeReq.Amount,
				Count:       count,
			}
			event.Prizes = append(event.Prizes, prize)
		}
	}

	err = s.repo.Update(event)
	if err != nil {
		return nil, err
	}

	return event, nil
}

func (s *eventService) DeleteEvent(id uint) error {
	return s.repo.Delete(id)
}

func (s *eventService) UpdateStage(id uint, stage models.EventStage) (*models.Event, error) {
	// Validate stage
	validStages := []models.EventStage{
		models.StageRegistration,
		models.StageCheckIn,
		models.StageSubmission,
		models.StageVoting,
		models.StageAwards,
		models.StageEnded,
	}
	
	isValid := false
	for _, validStage := range validStages {
		if stage == validStage {
			isValid = true
			break
		}
	}
	
	if !isValid {
		return nil, errors.New("invalid stage")
	}

	event, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	event.CurrentStage = stage
	err = s.repo.Update(event)
	if err != nil {
		return nil, err
	}

	return event, nil
}

