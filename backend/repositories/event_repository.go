package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type EventRepository interface {
	Create(event *models.Event) error
	GetByID(id uint) (*models.Event, error)
	GetAll() ([]models.Event, error)
	Update(event *models.Event) error
	Delete(id uint) error
	GetByOrganizer(organizerAddress string) ([]models.Event, error)
}

type eventRepository struct {
	db *gorm.DB
}

func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) Create(event *models.Event) error {
	return r.db.Create(event).Error
}

func (r *eventRepository) GetByID(id uint) (*models.Event, error) {
	var event models.Event
	err := r.db.Preload("Prizes").First(&event, id).Error
	if err != nil {
		return nil, err
	}
	return &event, nil
}

func (r *eventRepository) GetAll() ([]models.Event, error) {
	var events []models.Event
	err := r.db.Preload("Prizes").Find(&events).Error
	return events, err
}

func (r *eventRepository) Update(event *models.Event) error {
	// Delete existing prizes
	r.db.Where("event_id = ?", event.ID).Delete(&models.Prize{})
	// Update event and create new prizes
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(event).Error
}

func (r *eventRepository) Delete(id uint) error {
	return r.db.Delete(&models.Event{}, id).Error
}

func (r *eventRepository) GetByOrganizer(organizerAddress string) ([]models.Event, error) {
	var events []models.Event
	err := r.db.Preload("Prizes").Where("organizer_address = ?", organizerAddress).Find(&events).Error
	return events, err
}

