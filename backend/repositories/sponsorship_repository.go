package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type SponsorshipRepository interface {
	Create(sponsorship *models.Sponsorship) error
	GetByID(id uint) (*models.Sponsorship, error)
	GetByEventID(eventID uint) ([]models.Sponsorship, error)
	GetBySponsorID(sponsorID uint) ([]models.Sponsorship, error)
	GetByEventAndSponsor(eventID, sponsorID uint) ([]models.Sponsorship, error)
	Update(sponsorship *models.Sponsorship) error
	Delete(id uint) error
	GetApprovedByEventID(eventID uint) ([]models.Sponsorship, error)
}

type sponsorshipRepository struct {
	db *gorm.DB
}

func NewSponsorshipRepository(db *gorm.DB) SponsorshipRepository {
	return &sponsorshipRepository{db: db}
}

func (r *sponsorshipRepository) Create(sponsorship *models.Sponsorship) error {
	return r.db.Create(sponsorship).Error
}

func (r *sponsorshipRepository) GetByID(id uint) (*models.Sponsorship, error) {
	var sponsorship models.Sponsorship
	err := r.db.Preload("Event").Preload("Sponsor").First(&sponsorship, id).Error
	if err != nil {
		return nil, err
	}
	return &sponsorship, nil
}

func (r *sponsorshipRepository) GetByEventID(eventID uint) ([]models.Sponsorship, error) {
	var sponsorships []models.Sponsorship
	err := r.db.Preload("Sponsor").Where("event_id = ?", eventID).Find(&sponsorships).Error
	return sponsorships, err
}

func (r *sponsorshipRepository) GetBySponsorID(sponsorID uint) ([]models.Sponsorship, error) {
	var sponsorships []models.Sponsorship
	err := r.db.Preload("Event").Where("sponsor_id = ?", sponsorID).Find(&sponsorships).Error
	return sponsorships, err
}

func (r *sponsorshipRepository) GetByEventAndSponsor(eventID, sponsorID uint) ([]models.Sponsorship, error) {
	var sponsorships []models.Sponsorship
	err := r.db.Preload("Event").Preload("Sponsor").
		Where("event_id = ? AND sponsor_id = ?", eventID, sponsorID).
		Find(&sponsorships).Error
	return sponsorships, err
}

func (r *sponsorshipRepository) Update(sponsorship *models.Sponsorship) error {
	return r.db.Save(sponsorship).Error
}

func (r *sponsorshipRepository) Delete(id uint) error {
	return r.db.Delete(&models.Sponsorship{}, id).Error
}

func (r *sponsorshipRepository) GetApprovedByEventID(eventID uint) ([]models.Sponsorship, error) {
	var sponsorships []models.Sponsorship
	err := r.db.Preload("Sponsor").
		Where("event_id = ? AND status IN ?", eventID, []string{"approved", "deposited"}).
		Find(&sponsorships).Error
	return sponsorships, err
}

