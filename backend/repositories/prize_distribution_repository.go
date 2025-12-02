package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type PrizeDistributionRepository interface {
	Create(distribution *models.PrizeDistribution) error
	GetByID(id uint) (*models.PrizeDistribution, error)
	GetByEventID(eventID uint) ([]models.PrizeDistribution, error)
	Update(distribution *models.PrizeDistribution) error
	Delete(id uint) error
	DeleteByEventID(eventID uint) error
}

type prizeDistributionRepository struct {
	db *gorm.DB
}

func NewPrizeDistributionRepository(db *gorm.DB) PrizeDistributionRepository {
	return &prizeDistributionRepository{db: db}
}

func (r *prizeDistributionRepository) Create(distribution *models.PrizeDistribution) error {
	return r.db.Create(distribution).Error
}

func (r *prizeDistributionRepository) GetByID(id uint) (*models.PrizeDistribution, error) {
	var distribution models.PrizeDistribution
	err := r.db.First(&distribution, id).Error
	if err != nil {
		return nil, err
	}
	return &distribution, nil
}

func (r *prizeDistributionRepository) GetByEventID(eventID uint) ([]models.PrizeDistribution, error) {
	var distributions []models.PrizeDistribution
	err := r.db.Where("event_id = ?", eventID).Find(&distributions).Error
	return distributions, err
}

func (r *prizeDistributionRepository) Update(distribution *models.PrizeDistribution) error {
	return r.db.Save(distribution).Error
}

func (r *prizeDistributionRepository) Delete(id uint) error {
	return r.db.Delete(&models.PrizeDistribution{}, id).Error
}

func (r *prizeDistributionRepository) DeleteByEventID(eventID uint) error {
	return r.db.Where("event_id = ?", eventID).Delete(&models.PrizeDistribution{}).Error
}

