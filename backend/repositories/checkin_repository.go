package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type CheckInRepository interface {
	Create(checkIn *models.CheckIn) error
	GetByID(id uint) (*models.CheckIn, error)
	GetByEventID(eventID uint) ([]models.CheckIn, error)
	GetByUserAndEvent(userAddress string, eventID uint) (*models.CheckIn, error)
	GetByEventAndUser(eventID uint, userAddress string) ([]models.CheckIn, error)
	CountByEventID(eventID uint) (int64, error)
	Update(checkIn *models.CheckIn) error
	Delete(id uint) error
}

type checkInRepository struct {
	db *gorm.DB
}

func NewCheckInRepository(db *gorm.DB) CheckInRepository {
	return &checkInRepository{db: db}
}

func (r *checkInRepository) Create(checkIn *models.CheckIn) error {
	return r.db.Create(checkIn).Error
}

func (r *checkInRepository) GetByID(id uint) (*models.CheckIn, error) {
	var checkIn models.CheckIn
	err := r.db.Preload("Event").Preload("Team").First(&checkIn, id).Error
	if err != nil {
		return nil, err
	}
	return &checkIn, nil
}

func (r *checkInRepository) GetByEventID(eventID uint) ([]models.CheckIn, error) {
	var checkIns []models.CheckIn
	err := r.db.Preload("Team").Where("event_id = ?", eventID).
		Order("check_in_time DESC").Find(&checkIns).Error
	return checkIns, err
}

func (r *checkInRepository) GetByUserAndEvent(userAddress string, eventID uint) (*models.CheckIn, error) {
	var checkIn models.CheckIn
	err := r.db.Preload("Event").Preload("Team").
		Where("user_address = ? AND event_id = ?", userAddress, eventID).
		First(&checkIn).Error
	if err != nil {
		return nil, err
	}
	return &checkIn, nil
}

func (r *checkInRepository) GetByEventAndUser(eventID uint, userAddress string) ([]models.CheckIn, error) {
	var checkIns []models.CheckIn
	err := r.db.Preload("Team").
		Where("event_id = ? AND user_address = ?", eventID, userAddress).
		Order("check_in_time DESC").Find(&checkIns).Error
	return checkIns, err
}

func (r *checkInRepository) CountByEventID(eventID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.CheckIn{}).
		Where("event_id = ?", eventID).Count(&count).Error
	return count, err
}

func (r *checkInRepository) Update(checkIn *models.CheckIn) error {
	return r.db.Save(checkIn).Error
}

func (r *checkInRepository) Delete(id uint) error {
	return r.db.Delete(&models.CheckIn{}, id).Error
}

