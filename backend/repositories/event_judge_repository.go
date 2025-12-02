package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

// EventJudgeRepository manages judge whitelist records.
type EventJudgeRepository interface {
	Create(judge *models.EventJudge) error
	ListByEvent(eventID uint) ([]models.EventJudge, error)
	GetByEventAndAddress(eventID uint, address string) (*models.EventJudge, error)
	GetByID(id uint) (*models.EventJudge, error)
	Delete(id uint) error
}

type eventJudgeRepository struct {
	db *gorm.DB
}

func NewEventJudgeRepository(db *gorm.DB) EventJudgeRepository {
	return &eventJudgeRepository{db: db}
}

func (r *eventJudgeRepository) Create(judge *models.EventJudge) error {
	return r.db.Create(judge).Error
}

func (r *eventJudgeRepository) ListByEvent(eventID uint) ([]models.EventJudge, error) {
	var judges []models.EventJudge
	err := r.db.Where("event_id = ?", eventID).
		Order("created_at ASC").
		Find(&judges).Error
	return judges, err
}

func (r *eventJudgeRepository) GetByEventAndAddress(eventID uint, address string) (*models.EventJudge, error) {
	var judge models.EventJudge
	err := r.db.Where("event_id = ? AND address = ?", eventID, address).
		First(&judge).Error
	if err != nil {
		return nil, err
	}
	return &judge, nil
}

func (r *eventJudgeRepository) GetByID(id uint) (*models.EventJudge, error) {
	var judge models.EventJudge
	err := r.db.First(&judge, id).Error
	if err != nil {
		return nil, err
	}
	return &judge, nil
}

func (r *eventJudgeRepository) Delete(id uint) error {
	return r.db.Delete(&models.EventJudge{}, id).Error
}
