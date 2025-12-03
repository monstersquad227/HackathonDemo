package services

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
	"time"
)

type SubmissionService interface {
	CreateSubmission(req *CreateSubmissionRequest) (*models.Submission, error)
	GetSubmission(id uint) (*models.Submission, error)
	ListSubmissionsByEvent(eventID uint) ([]models.Submission, error)
	ListAllSubmissions() ([]models.Submission, error)
	UpdateSubmission(id uint, req *UpdateSubmissionRequest) (*models.Submission, error)
	ApproveSubmission(id uint, organizerAddress string, comment string) (*models.Submission, error)
	RejectSubmission(id uint, organizerAddress string, comment string) (*models.Submission, error)
	DeleteSubmission(id uint) error
}

type submissionService struct {
	submissionRepo repositories.SubmissionRepository
	eventRepo      repositories.EventRepository
	teamRepo       repositories.TeamRepository
}

func NewSubmissionService(
	submissionRepo repositories.SubmissionRepository,
	eventRepo repositories.EventRepository,
	teamRepo repositories.TeamRepository,
) SubmissionService {
	return &submissionService{
		submissionRepo: submissionRepo,
		eventRepo:      eventRepo,
		teamRepo:       teamRepo,
	}
}

type SubmissionFileRequest struct {
	FileName string `json:"file_name"`
	FileType string `json:"file_type"`
	URL      string `json:"url"`
	Hash     string `json:"hash"`
}

type CreateSubmissionRequest struct {
	EventID       uint                    `json:"event_id" binding:"required"`
	TeamID        *uint                   `json:"team_id"` // 可选，如果不提供则通过SubmittedBy自动查找
	Title         string                  `json:"title" binding:"required"`
	Description   string                  `json:"description"`
	GithubRepo    string                  `json:"github_repo"`
	DemoURL       string                  `json:"demo_url"`
	Documentation string                  `json:"documentation"`
	StorageURL    string                  `json:"storage_url"`
	SubmittedBy   string                  `json:"submitted_by" binding:"required"`
	Files         []SubmissionFileRequest `json:"files"`
}

type UpdateSubmissionRequest struct {
	Title         *string                 `json:"title"`
	Description   *string                 `json:"description"`
	GithubRepo    *string                 `json:"github_repo"`
	DemoURL       *string                 `json:"demo_url"`
	Documentation *string                 `json:"documentation"`
	StorageURL    *string                 `json:"storage_url"`
	Files         []SubmissionFileRequest `json:"files"`
	SubmittedBy   *string                 `json:"submitted_by"` // 队长钱包地址，用于验证
}

func (s *submissionService) CreateSubmission(req *CreateSubmissionRequest) (*models.Submission, error) {
	// Validate event exists
	event, err := s.eventRepo.GetByID(req.EventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	// Validate event stage (submission stage)
	if event.CurrentStage != models.StageSubmission {
		return nil, errors.New("event is not in submission stage")
	}

	// Determine team ID: if not provided, find by leader address and event
	var teamID uint
	if req.TeamID != nil && *req.TeamID > 0 {
		// Validate team exists
		if _, err := s.teamRepo.GetByID(*req.TeamID); err != nil {
			return nil, errors.New("team not found")
		}
		teamID = *req.TeamID
	} else {
		// Find team by leader address and event
		team, err := s.teamRepo.GetByLeaderAndEvent(req.SubmittedBy, req.EventID)
		if err != nil {
			return nil, errors.New("team not found for this leader address in this event")
		}
		teamID = team.ID
	}

	// Ensure submissions are unique per team/event
	existing, _ := s.submissionRepo.GetByTeamAndEvent(teamID, req.EventID)
	if existing != nil {
		return nil, errors.New("team already submitted for this event")
	}

	submission := &models.Submission{
		EventID:       req.EventID,
		TeamID:        teamID,
		Title:         req.Title,
		Description:   req.Description,
		GithubRepo:    req.GithubRepo,
		DemoURL:       req.DemoURL,
		Documentation: req.Documentation,
		StorageURL:    req.StorageURL,
		Status:        models.SubmissionStatusPending,
		SubmittedBy:   req.SubmittedBy,
		SubmittedAt:   time.Now(),
	}

	// Generate submission hash fingerprint (based on fields)
	hashInput := fmt.Sprintf("%d|%d|%s|%s|%s|%s|%s|%s",
		req.EventID,
		teamID,
		req.Title,
		req.Description,
		req.GithubRepo,
		req.DemoURL,
		req.Documentation,
		time.Now().String(),
	)
	submission.SubmissionHash = generateSubmissionHash(hashInput)

	// Attach files
	for _, file := range req.Files {
		submission.Files = append(submission.Files, models.SubmissionFile{
			FileName: file.FileName,
			FileType: file.FileType,
			URL:      file.URL,
			Hash:     file.Hash,
		})
	}

	err = s.submissionRepo.Create(submission)
	if err != nil {
		return nil, err
	}

	return submission, nil
}

func (s *submissionService) GetSubmission(id uint) (*models.Submission, error) {
	return s.submissionRepo.GetByID(id)
}

func (s *submissionService) ListSubmissionsByEvent(eventID uint) ([]models.Submission, error) {
	return s.submissionRepo.GetByEventID(eventID)
}

func (s *submissionService) ListAllSubmissions() ([]models.Submission, error) {
	return s.submissionRepo.GetAll()
}

func (s *submissionService) UpdateSubmission(id uint, req *UpdateSubmissionRequest) (*models.Submission, error) {
	submission, err := s.submissionRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 验证是否是队长在修改（如果提供了submitted_by）
	if req.SubmittedBy != nil {
		normalizedReq := normalizeAddress(*req.SubmittedBy)
		normalizedSubmitted := normalizeAddress(submission.SubmittedBy)
		if normalizedReq != normalizedSubmitted {
			return nil, errors.New("only the team leader who submitted can update this submission")
		}
	}

	// 允许队长实时修改，不再限制状态
	// 移除状态检查，允许任何状态的提交都可以被队长修改

	if req.Title != nil {
		submission.Title = *req.Title
	}
	if req.Description != nil {
		submission.Description = *req.Description
	}
	if req.GithubRepo != nil {
		submission.GithubRepo = *req.GithubRepo
	}
	if req.DemoURL != nil {
		submission.DemoURL = *req.DemoURL
	}
	if req.Documentation != nil {
		submission.Documentation = *req.Documentation
	}
	if req.StorageURL != nil {
		submission.StorageURL = *req.StorageURL
	}

	if req.Files != nil {
		submission.Files = []models.SubmissionFile{}
		for _, file := range req.Files {
			submission.Files = append(submission.Files, models.SubmissionFile{
				FileName: file.FileName,
				FileType: file.FileType,
				URL:      file.URL,
				Hash:     file.Hash,
			})
		}
	}

	err = s.submissionRepo.Update(submission)
	if err != nil {
		return nil, err
	}

	return submission, nil
}

func (s *submissionService) ApproveSubmission(id uint, organizerAddress string, comment string) (*models.Submission, error) {
	submission, err := s.submissionRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Verify organizer owns the event
	event, err := s.eventRepo.GetByID(submission.EventID)
	if err != nil {
		return nil, err
	}

	if event.OrganizerAddress != organizerAddress {
		return nil, errors.New("only organizer can approve submissions")
	}

	submission.Status = models.SubmissionStatusApproved
	submission.ReviewerComment = comment

	err = s.submissionRepo.Update(submission)
	if err != nil {
		return nil, err
	}

	return submission, nil
}

func (s *submissionService) RejectSubmission(id uint, organizerAddress string, comment string) (*models.Submission, error) {
	submission, err := s.submissionRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	event, err := s.eventRepo.GetByID(submission.EventID)
	if err != nil {
		return nil, err
	}

	if event.OrganizerAddress != organizerAddress {
		return nil, errors.New("only organizer can reject submissions")
	}

	submission.Status = models.SubmissionStatusRejected
	submission.ReviewerComment = comment

	err = s.submissionRepo.Update(submission)
	if err != nil {
		return nil, err
	}

	return submission, nil
}

func (s *submissionService) DeleteSubmission(id uint) error {
	return s.submissionRepo.Delete(id)
}

func generateSubmissionHash(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}
