package services

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
	"time"
)

type FundingPoolService interface {
	CreateFundingPool(eventID uint, contractAddress string) (*models.FundingPool, error)
	GetFundingPool(id uint) (*models.FundingPool, error)
	GetFundingPoolByEvent(eventID uint) (*models.FundingPool, error)
	ListFundingPools() ([]models.FundingPool, error)
	UpdateFundingPool(id uint, req *UpdateFundingPoolRequest) (*models.FundingPool, error)
	SetLockedUntil(eventID uint, lockedUntil time.Time) (*models.FundingPool, error)
	MarkAsDistributed(eventID uint) (*models.FundingPool, error)
	DeleteFundingPool(id uint) error
}

type fundingPoolService struct {
	poolRepo     repositories.FundingPoolRepository
	eventRepo    repositories.EventRepository
	distRepo     repositories.PrizeDistributionRepository
}

func NewFundingPoolService(
	poolRepo repositories.FundingPoolRepository,
	eventRepo repositories.EventRepository,
	distRepo repositories.PrizeDistributionRepository,
) FundingPoolService {
	return &fundingPoolService{
		poolRepo:  poolRepo,
		eventRepo: eventRepo,
		distRepo:  distRepo,
	}
}

type UpdateFundingPoolRequest struct {
	TotalAmount *string `json:"total_amount"`
}

func (s *fundingPoolService) CreateFundingPool(eventID uint, contractAddress string) (*models.FundingPool, error) {
	// Check if event exists
	_, err := s.eventRepo.GetByID(eventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	// Check if pool already exists
	existing, _ := s.poolRepo.GetByEventID(eventID)
	if existing != nil {
		return nil, errors.New("funding pool already exists for this event")
	}

	pool := &models.FundingPool{
		EventID:         eventID,
		ContractAddress: contractAddress,
		TotalAmount:     "0",
		Distributed:     false,
	}

	err = s.poolRepo.Create(pool)
	if err != nil {
		return nil, err
	}

	return pool, nil
}

func (s *fundingPoolService) GetFundingPool(id uint) (*models.FundingPool, error) {
	return s.poolRepo.GetByID(id)
}

func (s *fundingPoolService) GetFundingPoolByEvent(eventID uint) (*models.FundingPool, error) {
	return s.poolRepo.GetByEventID(eventID)
}

func (s *fundingPoolService) ListFundingPools() ([]models.FundingPool, error) {
	return s.poolRepo.GetAll()
}

func (s *fundingPoolService) UpdateFundingPool(id uint, req *UpdateFundingPoolRequest) (*models.FundingPool, error) {
	pool, err := s.poolRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if req.TotalAmount != nil {
		pool.TotalAmount = *req.TotalAmount
	}

	err = s.poolRepo.Update(pool)
	if err != nil {
		return nil, err
	}

	return pool, nil
}

func (s *fundingPoolService) SetLockedUntil(eventID uint, lockedUntil time.Time) (*models.FundingPool, error) {
	pool, err := s.poolRepo.GetByEventID(eventID)
	if err != nil {
		return nil, err
	}

	pool.LockedUntil = &lockedUntil
	err = s.poolRepo.Update(pool)
	if err != nil {
		return nil, err
	}

	return pool, nil
}

func (s *fundingPoolService) MarkAsDistributed(eventID uint) (*models.FundingPool, error) {
	pool, err := s.poolRepo.GetByEventID(eventID)
	if err != nil {
		return nil, err
	}

	pool.Distributed = true
	err = s.poolRepo.Update(pool)
	if err != nil {
		return nil, err
	}

	return pool, nil
}

func (s *fundingPoolService) DeleteFundingPool(id uint) error {
	return s.poolRepo.Delete(id)
}

