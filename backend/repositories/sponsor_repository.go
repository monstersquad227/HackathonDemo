package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type SponsorRepository interface {
	Create(sponsor *models.Sponsor) error
	GetByID(id uint) (*models.Sponsor, error)
	GetByAddress(address string) (*models.Sponsor, error)
	GetAll() ([]models.Sponsor, error)
	Update(sponsor *models.Sponsor) error
	Delete(id uint) error
}

type sponsorRepository struct {
	db *gorm.DB
}

func NewSponsorRepository(db *gorm.DB) SponsorRepository {
	return &sponsorRepository{db: db}
}

func (r *sponsorRepository) Create(sponsor *models.Sponsor) error {
	return r.db.Create(sponsor).Error
}

func (r *sponsorRepository) GetByID(id uint) (*models.Sponsor, error) {
	var sponsor models.Sponsor
	err := r.db.First(&sponsor, id).Error
	if err != nil {
		return nil, err
	}
	return &sponsor, nil
}

func (r *sponsorRepository) GetByAddress(address string) (*models.Sponsor, error) {
	var sponsor models.Sponsor
	err := r.db.Where("address = ?", address).First(&sponsor).Error
	if err != nil {
		return nil, err
	}
	return &sponsor, nil
}

func (r *sponsorRepository) GetAll() ([]models.Sponsor, error) {
	var sponsors []models.Sponsor
	err := r.db.Find(&sponsors).Error
	return sponsors, err
}

func (r *sponsorRepository) Update(sponsor *models.Sponsor) error {
	return r.db.Save(sponsor).Error
}

func (r *sponsorRepository) Delete(id uint) error {
	return r.db.Delete(&models.Sponsor{}, id).Error
}

