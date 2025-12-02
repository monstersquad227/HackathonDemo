package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type FundingPoolRepository interface {
	Create(pool *models.FundingPool) error
	GetByID(id uint) (*models.FundingPool, error)
	GetByEventID(eventID uint) (*models.FundingPool, error)
	GetAll() ([]models.FundingPool, error)
	Update(pool *models.FundingPool) error
	Delete(id uint) error
}

type fundingPoolRepository struct {
	db *gorm.DB
}

func NewFundingPoolRepository(db *gorm.DB) FundingPoolRepository {
	return &fundingPoolRepository{db: db}
}

func (r *fundingPoolRepository) Create(pool *models.FundingPool) error {
	return r.db.Create(pool).Error
}

func (r *fundingPoolRepository) GetByID(id uint) (*models.FundingPool, error) {
	var pool models.FundingPool
	err := r.db.Preload("Event").Preload("Sponsorships.Sponsor").First(&pool, id).Error
	if err != nil {
		return nil, err
	}
	return &pool, nil
}

func (r *fundingPoolRepository) GetByEventID(eventID uint) (*models.FundingPool, error) {
	var pool models.FundingPool
	err := r.db.Preload("Event").Preload("Sponsorships.Sponsor").
		Where("event_id = ?", eventID).First(&pool).Error
	if err != nil {
		return nil, err
	}
	return &pool, nil
}

func (r *fundingPoolRepository) GetAll() ([]models.FundingPool, error) {
	var pools []models.FundingPool
	err := r.db.Preload("Event").Preload("Sponsorships.Sponsor").Find(&pools).Error
	return pools, err
}

func (r *fundingPoolRepository) Update(pool *models.FundingPool) error {
	return r.db.Save(pool).Error
}

func (r *fundingPoolRepository) Delete(id uint) error {
	return r.db.Delete(&models.FundingPool{}, id).Error
}

