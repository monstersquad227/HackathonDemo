package services

import (
	"errors"
	"fmt"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
	"strings"
	"time"
)

const (
	maxPublicVotesPerEvent = 3
)

// VoteService exposes the voting use cases.
type VoteService interface {
	CastVote(req *CastVoteRequest) (*models.Vote, error)
	ListVotesByEvent(eventID uint) ([]models.Vote, error)
	ListVotesBySubmission(submissionID uint) ([]models.Vote, error)
	GetVote(id uint) (*models.Vote, error)
	DeleteVote(id uint, organizerAddress string) error
	GetEventSummary(eventID uint) ([]VoteSummary, error)

	AddJudge(eventID uint, req *AddJudgeRequest) (*models.EventJudge, error)
	ListJudges(eventID uint) ([]models.EventJudge, error)
	RemoveJudge(eventID uint, judgeID uint, organizerAddress string) error
}

type voteService struct {
	voteRepo        repositories.VoteRepository
	eventRepo       repositories.EventRepository
	submissionRepo  repositories.SubmissionRepository
	eventJudgeRepo  repositories.EventJudgeRepository
	sponsorRepo     repositories.SponsorRepository
	sponsorshipRepo repositories.SponsorshipRepository
}

func NewVoteService(
	voteRepo repositories.VoteRepository,
	eventRepo repositories.EventRepository,
	submissionRepo repositories.SubmissionRepository,
	eventJudgeRepo repositories.EventJudgeRepository,
	sponsorRepo repositories.SponsorRepository,
	sponsorshipRepo repositories.SponsorshipRepository,
) VoteService {
	return &voteService{
		voteRepo:        voteRepo,
		eventRepo:       eventRepo,
		submissionRepo:  submissionRepo,
		eventJudgeRepo:  eventJudgeRepo,
		sponsorRepo:     sponsorRepo,
		sponsorshipRepo: sponsorshipRepo,
	}
}

// CastVoteRequest represents the payload for casting a vote.
type CastVoteRequest struct {
	EventID       uint             `json:"event_id" binding:"required"`
	SubmissionID  uint             `json:"submission_id" binding:"required"`
	VoterAddress  string           `json:"voter_address" binding:"required"`
	VoterType     models.VoterType `json:"voter_type" binding:"required"`
	Reason        string           `json:"reason"`
	Signature     string           `json:"signature"`
	OffchainProof string           `json:"offchain_proof"`
	Weight        *float64         `json:"weight"`
}

// VoteSummary represents aggregated scores for a submission.
type VoteSummary struct {
	SubmissionID    uint    `json:"submission_id"`
	SubmissionTitle string  `json:"submission_title"`
	TotalWeight     float64 `json:"total_weight"`
	JudgeWeight     float64 `json:"judge_weight"`
	SponsorWeight   float64 `json:"sponsor_weight"`
	PublicWeight    float64 `json:"public_weight"`
	VoteCount       int64   `json:"vote_count"`
}

// AddJudgeRequest contains judge assignment payload.
type AddJudgeRequest struct {
	Address          string   `json:"address" binding:"required"`
	Weight           *float64 `json:"weight"`
	MaxVotes         *uint    `json:"max_votes"`
	OrganizerAddress string   `json:"organizer_address" binding:"required"`
}

func (s *voteService) CastVote(req *CastVoteRequest) (*models.Vote, error) {
	if req == nil {
		return nil, errors.New("request is required")
	}

	address := normalizeAddress(req.VoterAddress)
	if address == "" {
		return nil, errors.New("invalid voter address")
	}

	event, err := s.eventRepo.GetByID(req.EventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	if event.CurrentStage != models.StageVoting {
		return nil, errors.New("event is not in voting stage")
	}

	now := time.Now()
	if event.VotingStartTime != nil && now.Before(*event.VotingStartTime) {
		return nil, errors.New("voting has not started yet")
	}

	if event.VotingEndTime != nil && now.After(*event.VotingEndTime) {
		return nil, errors.New("voting has already ended")
	}

	submission, err := s.submissionRepo.GetByID(req.SubmissionID)
	if err != nil {
		return nil, errors.New("submission not found")
	}

	if submission.EventID != event.ID {
		return nil, errors.New("submission does not belong to this event")
	}

	weight, err := s.calculateWeight(req, event, address)
	if err != nil {
		return nil, err
	}

	vote := &models.Vote{
		EventID:       event.ID,
		SubmissionID:  submission.ID,
		VoterAddress:  address,
		VoterType:     req.VoterType,
		Weight:        weight,
		Reason:        req.Reason,
		Signature:     req.Signature,
		OffchainProof: req.OffchainProof,
	}

	if err := s.voteRepo.Create(vote); err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return nil, errors.New("you already voted for this submission")
		}
		return nil, err
	}

	return vote, nil
}

func (s *voteService) calculateWeight(req *CastVoteRequest, event *models.Event, address string) (float64, error) {
	switch req.VoterType {
	case models.VoterTypeJudge:
		judge, err := s.eventJudgeRepo.GetByEventAndAddress(event.ID, address)
		if err != nil {
			return 0, errors.New("address is not on the judge whitelist")
		}
		if judge.Weight <= 0 {
			return 0, errors.New("judge weight must be greater than zero")
		}
		count, err := s.voteRepo.CountByEventAndVoter(event.ID, address, models.VoterTypeJudge)
		if err != nil {
			return 0, err
		}
		if judge.MaxVotes > 0 && count >= int64(judge.MaxVotes) {
			return 0, fmt.Errorf("judge vote limit (%d) reached", judge.MaxVotes)
		}
		return judge.Weight, nil
	case models.VoterTypeSponsor:
		if !event.AllowSponsorVoting {
			return 0, errors.New("sponsor voting is disabled for this event")
		}
		sponsor, err := s.sponsorRepo.GetByAddress(address)
		if err != nil {
			return 0, errors.New("sponsor with this address not found")
		}
		sponsorships, err := s.sponsorshipRepo.GetByEventAndSponsor(event.ID, sponsor.ID)
		if err != nil {
			return 0, err
		}
		var totalPower float64
		for _, sship := range sponsorships {
			if sship.Status != models.SponsorshipStatusApproved && sship.Status != models.SponsorshipStatusDeposited {
				continue
			}
			if sship.VotingPower > 0 {
				totalPower += sship.VotingPower
			}
		}
		if totalPower == 0 {
			totalPower = 1
		}
		return totalPower, nil
	case models.VoterTypePublic:
		if !event.AllowPublicVoting {
			return 0, errors.New("public voting is disabled for this event")
		}
		count, err := s.voteRepo.CountBySubmissionAndVoter(req.SubmissionID, address, models.VoterTypePublic)
		if err != nil {
			return 0, err
		}
		if count > 0 {
			return 0, errors.New("public voters can only vote once per submission")
		}
		eventCount, err := s.voteRepo.CountByEventAndVoter(event.ID, address, models.VoterTypePublic)
		if err != nil {
			return 0, err
		}
		if eventCount >= maxPublicVotesPerEvent {
			return 0, fmt.Errorf("public voters can only vote %d times per event", maxPublicVotesPerEvent)
		}
		if req.Weight != nil && *req.Weight > 0 {
			return *req.Weight, nil
		}
		return 1, nil
	default:
		return 0, errors.New("unsupported voter type")
	}
}

func (s *voteService) ListVotesByEvent(eventID uint) ([]models.Vote, error) {
	return s.voteRepo.GetByEventID(eventID)
}

func (s *voteService) ListVotesBySubmission(submissionID uint) ([]models.Vote, error) {
	return s.voteRepo.GetBySubmissionID(submissionID)
}

func (s *voteService) GetVote(id uint) (*models.Vote, error) {
	return s.voteRepo.GetByID(id)
}

func (s *voteService) DeleteVote(id uint, organizerAddress string) error {
	vote, err := s.voteRepo.GetByID(id)
	if err != nil {
		return err
	}

	event, err := s.eventRepo.GetByID(vote.EventID)
	if err != nil {
		return err
	}

	if normalizeAddress(event.OrganizerAddress) != normalizeAddress(organizerAddress) {
		return errors.New("only the organizer can delete votes")
	}

	return s.voteRepo.Delete(id)
}

func (s *voteService) GetEventSummary(eventID uint) ([]VoteSummary, error) {
	rows, err := s.voteRepo.GetSummaryByEvent(eventID)
	if err != nil {
		return nil, err
	}

	var summaries []VoteSummary
	for _, row := range rows {
		summaries = append(summaries, VoteSummary{
			SubmissionID:    row.SubmissionID,
			SubmissionTitle: row.SubmissionTitle,
			TotalWeight:     row.TotalWeight,
			JudgeWeight:     row.JudgeWeight,
			SponsorWeight:   row.SponsorWeight,
			PublicWeight:    row.PublicWeight,
			VoteCount:       row.VoteCount,
		})
	}
	return summaries, nil
}

func (s *voteService) AddJudge(eventID uint, req *AddJudgeRequest) (*models.EventJudge, error) {
	event, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return nil, errors.New("event not found")
	}
	if normalizeAddress(event.OrganizerAddress) != normalizeAddress(req.OrganizerAddress) {
		return nil, errors.New("only the organizer can manage judges")
	}

	address := normalizeAddress(req.Address)
	if address == "" {
		return nil, errors.New("invalid address")
	}

	weight := 1.0
	if req.Weight != nil && *req.Weight > 0 {
		weight = *req.Weight
	}

	maxVotes := uint(100)
	if req.MaxVotes != nil && *req.MaxVotes > 0 {
		maxVotes = *req.MaxVotes
	}

	judge := &models.EventJudge{
		EventID:  eventID,
		Address:  address,
		Weight:   weight,
		MaxVotes: maxVotes,
	}

	if err := s.eventJudgeRepo.Create(judge); err != nil {
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			return nil, errors.New("address already exists in judge whitelist")
		}
		return nil, err
	}

	return judge, nil
}

func (s *voteService) ListJudges(eventID uint) ([]models.EventJudge, error) {
	return s.eventJudgeRepo.ListByEvent(eventID)
}

func (s *voteService) RemoveJudge(eventID uint, judgeID uint, organizerAddress string) error {
	event, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return errors.New("event not found")
	}
	if normalizeAddress(event.OrganizerAddress) != normalizeAddress(organizerAddress) {
		return errors.New("only the organizer can manage judges")
	}

	judge, err := s.eventJudgeRepo.GetByID(judgeID)
	if err != nil {
		return err
	}
	if judge.EventID != eventID {
		return errors.New("judge does not belong to this event")
	}

	return s.eventJudgeRepo.Delete(judgeID)
}

func normalizeAddress(address string) string {
	return strings.ToLower(strings.TrimSpace(address))
}

