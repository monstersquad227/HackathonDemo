package services

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
)

type SponsorService interface {
	CreateSponsor(req *CreateSponsorRequest) (*models.Sponsor, error)
	GetSponsor(id uint) (*models.Sponsor, error)
	GetSponsorByAddress(address string) (*models.Sponsor, error)
	ListSponsors() ([]models.Sponsor, error)
	UpdateSponsor(id uint, req *UpdateSponsorRequest) (*models.Sponsor, error)
	DeleteSponsor(id uint) error
}

type sponsorService struct {
	sponsorRepo repositories.SponsorRepository
}

func NewSponsorService(sponsorRepo repositories.SponsorRepository) SponsorService {
	return &sponsorService{sponsorRepo: sponsorRepo}
}

type CreateSponsorRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	LogoURL     string `json:"logo_url"`
	WebsiteURL  string `json:"website_url"`
	Address     string `json:"address" binding:"required"`
}

type UpdateSponsorRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	LogoURL     *string `json:"logo_url"`
	WebsiteURL  *string `json:"website_url"`
}

func (s *sponsorService) CreateSponsor(req *CreateSponsorRequest) (*models.Sponsor, error) {
	// Check if sponsor with address already exists
	existing, _ := s.sponsorRepo.GetByAddress(req.Address)
	if existing != nil {
		return nil, errors.New("sponsor with this address already exists")
	}

	sponsor := &models.Sponsor{
		Name:        req.Name,
		Description: req.Description,
		LogoURL:     req.LogoURL,
		WebsiteURL:  req.WebsiteURL,
		Address:     req.Address,
	}

	err := s.sponsorRepo.Create(sponsor)
	if err != nil {
		return nil, err
	}

	return sponsor, nil
}

func (s *sponsorService) GetSponsor(id uint) (*models.Sponsor, error) {
	return s.sponsorRepo.GetByID(id)
}

func (s *sponsorService) GetSponsorByAddress(address string) (*models.Sponsor, error) {
	return s.sponsorRepo.GetByAddress(address)
}

func (s *sponsorService) ListSponsors() ([]models.Sponsor, error) {
	return s.sponsorRepo.GetAll()
}

func (s *sponsorService) UpdateSponsor(id uint, req *UpdateSponsorRequest) (*models.Sponsor, error) {
	sponsor, err := s.sponsorRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		sponsor.Name = *req.Name
	}
	if req.Description != nil {
		sponsor.Description = *req.Description
	}
	if req.LogoURL != nil {
		sponsor.LogoURL = *req.LogoURL
	}
	if req.WebsiteURL != nil {
		sponsor.WebsiteURL = *req.WebsiteURL
	}

	err = s.sponsorRepo.Update(sponsor)
	if err != nil {
		return nil, err
	}

	return sponsor, nil
}

func (s *sponsorService) DeleteSponsor(id uint) error {
	return s.sponsorRepo.Delete(id)
}

