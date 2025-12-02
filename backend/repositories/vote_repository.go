package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

// VoteRepository handles persistence for votes.
type VoteRepository interface {
	Create(vote *models.Vote) error
	GetByID(id uint) (*models.Vote, error)
	GetByEventID(eventID uint) ([]models.Vote, error)
	GetBySubmissionID(submissionID uint) ([]models.Vote, error)
	Delete(id uint) error
	CountByEventAndVoter(eventID uint, address string, voterType models.VoterType) (int64, error)
	CountBySubmissionAndVoter(submissionID uint, address string, voterType models.VoterType) (int64, error)
	GetSummaryByEvent(eventID uint) ([]VoteSummaryRow, error)
}

// VoteSummaryRow represents aggregated vote data for a submission.
type VoteSummaryRow struct {
	SubmissionID    uint    `json:"submission_id"`
	SubmissionTitle string  `json:"submission_title"`
	TotalWeight     float64 `json:"total_weight"`
	JudgeWeight     float64 `json:"judge_weight"`
	SponsorWeight   float64 `json:"sponsor_weight"`
	PublicWeight    float64 `json:"public_weight"`
	VoteCount       int64   `json:"vote_count"`
}

type voteRepository struct {
	db *gorm.DB
}

func NewVoteRepository(db *gorm.DB) VoteRepository {
	return &voteRepository{db: db}
}

func (r *voteRepository) Create(vote *models.Vote) error {
	return r.db.Create(vote).Error
}

func (r *voteRepository) GetByID(id uint) (*models.Vote, error) {
	var vote models.Vote
	err := r.db.Preload("Submission").First(&vote, id).Error
	if err != nil {
		return nil, err
	}
	return &vote, nil
}

func (r *voteRepository) GetByEventID(eventID uint) ([]models.Vote, error) {
	var votes []models.Vote
	err := r.db.Preload("Submission").
		Where("event_id = ?", eventID).
		Order("created_at DESC").
		Find(&votes).Error
	return votes, err
}

func (r *voteRepository) GetBySubmissionID(submissionID uint) ([]models.Vote, error) {
	var votes []models.Vote
	err := r.db.Preload("Submission").
		Where("submission_id = ?", submissionID).
		Order("created_at DESC").
		Find(&votes).Error
	return votes, err
}

func (r *voteRepository) Delete(id uint) error {
	return r.db.Delete(&models.Vote{}, id).Error
}

func (r *voteRepository) CountByEventAndVoter(eventID uint, address string, voterType models.VoterType) (int64, error) {
	var count int64
	err := r.db.Model(&models.Vote{}).
		Where("event_id = ? AND voter_address = ? AND voter_type = ?", eventID, address, voterType).
		Count(&count).Error
	return count, err
}

func (r *voteRepository) CountBySubmissionAndVoter(submissionID uint, address string, voterType models.VoterType) (int64, error) {
	var count int64
	err := r.db.Model(&models.Vote{}).
		Where("submission_id = ? AND voter_address = ? AND voter_type = ?", submissionID, address, voterType).
		Count(&count).Error
	return count, err
}

func (r *voteRepository) GetSummaryByEvent(eventID uint) ([]VoteSummaryRow, error) {
	var rows []VoteSummaryRow
	err := r.db.
		Table("votes").
		Select(`
			votes.submission_id as submission_id,
			submissions.title as submission_title,
			COALESCE(SUM(weight), 0) as total_weight,
			COALESCE(SUM(CASE WHEN voter_type = ? THEN weight ELSE 0 END), 0) as judge_weight,
			COALESCE(SUM(CASE WHEN voter_type = ? THEN weight ELSE 0 END), 0) as sponsor_weight,
			COALESCE(SUM(CASE WHEN voter_type = ? THEN weight ELSE 0 END), 0) as public_weight,
			COUNT(*) as vote_count`,
			models.VoterTypeJudge,
			models.VoterTypeSponsor,
			models.VoterTypePublic,
		).
		Joins("JOIN submissions ON submissions.id = votes.submission_id").
		Where("votes.event_id = ?", eventID).
		Group("votes.submission_id, submissions.title").
		Order("total_weight DESC").
		Scan(&rows).Error

	return rows, err
}
