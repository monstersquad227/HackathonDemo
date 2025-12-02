package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type SubmissionRepository interface {
	Create(submission *models.Submission) error
	GetByID(id uint) (*models.Submission, error)
	GetByEventID(eventID uint) ([]models.Submission, error)
	GetByTeamAndEvent(teamID uint, eventID uint) (*models.Submission, error)
	GetAll() ([]models.Submission, error)
	Update(submission *models.Submission) error
	Delete(id uint) error
}

type submissionRepository struct {
	db *gorm.DB
}

func NewSubmissionRepository(db *gorm.DB) SubmissionRepository {
	return &submissionRepository{db: db}
}

func (r *submissionRepository) Create(submission *models.Submission) error {
	return r.db.Create(submission).Error
}

func (r *submissionRepository) GetByID(id uint) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.
		Preload("Files").
		Preload("Event").
		Preload("Team.Members").
		First(&submission, id).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *submissionRepository) GetByEventID(eventID uint) ([]models.Submission, error) {
	var submissions []models.Submission
	err := r.db.
		Preload("Files").
		Preload("Team").
		Where("event_id = ?", eventID).
		Order("submitted_at DESC").
		Find(&submissions).Error
	return submissions, err
}

func (r *submissionRepository) GetByTeamAndEvent(teamID uint, eventID uint) (*models.Submission, error) {
	var submission models.Submission
	err := r.db.
		Preload("Files").
		Where("team_id = ? AND event_id = ?", teamID, eventID).
		First(&submission).Error
	if err != nil {
		return nil, err
	}
	return &submission, nil
}

func (r *submissionRepository) GetAll() ([]models.Submission, error) {
	var submissions []models.Submission
	err := r.db.
		Preload("Files").
		Preload("Event").
		Preload("Team").
		Find(&submissions).Error
	return submissions, err
}

func (r *submissionRepository) Update(submission *models.Submission) error {
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(submission).Error
}

func (r *submissionRepository) Delete(id uint) error {
	return r.db.Delete(&models.Submission{}, id).Error
}
