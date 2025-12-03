package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type RegistrationRepository interface {
	Create(registration *models.Registration) error
	GetByID(id uint) (*models.Registration, error)
	GetByEventID(eventID uint) ([]models.Registration, error)
	GetByTeamID(teamID uint) ([]models.Registration, error)
	GetByEventAndTeam(eventID, teamID uint) (*models.Registration, error)
	GetByEventAndWallet(eventID uint, walletAddress string) (*models.Registration, error)
	Update(registration *models.Registration) error
	Delete(id uint) error
	GetPendingByEventID(eventID uint) ([]models.Registration, error)
	CountApprovedByEventID(eventID uint) (int64, error)
}

type registrationRepository struct {
	db *gorm.DB
}

func NewRegistrationRepository(db *gorm.DB) RegistrationRepository {
	return &registrationRepository{db: db}
}

func (r *registrationRepository) Create(registration *models.Registration) error {
	return r.db.Create(registration).Error
}

func (r *registrationRepository) GetByID(id uint) (*models.Registration, error) {
	var registration models.Registration
	err := r.db.Preload("Event").Preload("Team.Members").First(&registration, id).Error
	if err != nil {
		return nil, err
	}
	return &registration, nil
}

func (r *registrationRepository) GetByEventID(eventID uint) ([]models.Registration, error) {
	var registrations []models.Registration
	err := r.db.Preload("Team.Members").Preload("Event").
		Where("event_id = ?", eventID).Find(&registrations).Error
	return registrations, err
}

func (r *registrationRepository) GetByTeamID(teamID uint) ([]models.Registration, error) {
	var registrations []models.Registration
	err := r.db.Preload("Event").Preload("Team.Members").
		Where("team_id = ?", teamID).Find(&registrations).Error
	return registrations, err
}

func (r *registrationRepository) GetByEventAndTeam(eventID, teamID uint) (*models.Registration, error) {
	var registration models.Registration
	err := r.db.Preload("Event").Preload("Team.Members").
		Where("event_id = ? AND team_id = ?", eventID, teamID).First(&registration).Error
	if err != nil {
		return nil, err
	}
	return &registration, nil
}

func (r *registrationRepository) GetByEventAndWallet(eventID uint, walletAddress string) (*models.Registration, error) {
	var registration models.Registration
	err := r.db.Preload("Event").
		Where("event_id = ? AND wallet_address = ?", eventID, walletAddress).First(&registration).Error
	if err != nil {
		return nil, err
	}
	return &registration, nil
}

func (r *registrationRepository) Update(registration *models.Registration) error {
	return r.db.Save(registration).Error
}

func (r *registrationRepository) Delete(id uint) error {
	return r.db.Delete(&models.Registration{}, id).Error
}

func (r *registrationRepository) GetPendingByEventID(eventID uint) ([]models.Registration, error) {
	var registrations []models.Registration
	err := r.db.Preload("Team.Members").Preload("Event").
		Where("event_id = ? AND status = ?", eventID, "pending").Find(&registrations).Error
	return registrations, err
}

func (r *registrationRepository) CountApprovedByEventID(eventID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Registration{}).
		Where("event_id = ? AND status = ?", eventID, models.RegistrationStatusApproved).
		Count(&count).Error
	return count, err
}

