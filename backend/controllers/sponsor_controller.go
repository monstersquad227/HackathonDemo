package controllers

import (
	"errors"
	"hackathon-platform/backend/repositories"
	"hackathon-platform/backend/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SponsorController struct {
	service services.SponsorService
}

func NewSponsorController(db *gorm.DB) *SponsorController {
	repo := repositories.NewSponsorRepository(db)
	service := services.NewSponsorService(repo)
	return &SponsorController{service: service}
}

// CreateSponsor creates a new sponsor
func (c *SponsorController) CreateSponsor(ctx *gin.Context) {
	var req services.CreateSponsorRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sponsor, err := c.service.CreateSponsor(&req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, sponsor)
}

// ListSponsors retrieves all sponsors
func (c *SponsorController) ListSponsors(ctx *gin.Context) {
	sponsors, err := c.service.ListSponsors()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsors)
}

// GetSponsor retrieves a sponsor by ID
func (c *SponsorController) GetSponsor(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid sponsor ID"})
		return
	}

	sponsor, err := c.service.GetSponsor(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Sponsor not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsor)
}

// GetSponsorByAddress retrieves a sponsor by wallet address
func (c *SponsorController) GetSponsorByAddress(ctx *gin.Context) {
	address := ctx.Param("address")
	if address == "" {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Address is required"})
		return
	}

	sponsor, err := c.service.GetSponsorByAddress(address)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Sponsor not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsor)
}

// UpdateSponsor updates an existing sponsor
func (c *SponsorController) UpdateSponsor(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid sponsor ID"})
		return
	}

	var req services.UpdateSponsorRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sponsor, err := c.service.UpdateSponsor(uint(id), &req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Sponsor not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsor)
}

// DeleteSponsor deletes a sponsor
func (c *SponsorController) DeleteSponsor(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid sponsor ID"})
		return
	}

	err = c.service.DeleteSponsor(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Sponsor not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Sponsor deleted successfully"})
}

