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

type SponsorshipController struct {
	service services.SponsorshipService
}

func NewSponsorshipController(db *gorm.DB) *SponsorshipController {
	sponsorshipRepo := repositories.NewSponsorshipRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	sponsorRepo := repositories.NewSponsorRepository(db)
	service := services.NewSponsorshipService(sponsorshipRepo, eventRepo, sponsorRepo)
	return &SponsorshipController{service: service}
}

// CreateSponsorship creates a new sponsorship
func (c *SponsorshipController) CreateSponsorship(ctx *gin.Context) {
	var req services.CreateSponsorshipRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sponsorship, err := c.service.CreateSponsorship(&req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, sponsorship)
}

// ListSponsorshipsByEvent retrieves all sponsorships for an event
func (c *SponsorshipController) ListSponsorshipsByEvent(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	sponsorships, err := c.service.GetSponsorshipsByEvent(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsorships)
}

// GetSponsorship retrieves a sponsorship by ID
func (c *SponsorshipController) GetSponsorship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid sponsorship ID"})
		return
	}

	sponsorship, err := c.service.GetSponsorship(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Sponsorship not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsorship)
}

// ApproveSponsorship approves a sponsorship (organizer only)
func (c *SponsorshipController) ApproveSponsorship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid sponsorship ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sponsorship, err := c.service.ApproveSponsorship(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsorship)
}

// RejectSponsorship rejects a sponsorship (organizer only)
func (c *SponsorshipController) RejectSponsorship(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid sponsorship ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sponsorship, err := c.service.RejectSponsorship(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsorship)
}

// UpdateDepositStatus updates the deposit status of a sponsorship
func (c *SponsorshipController) UpdateDepositStatus(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid sponsorship ID"})
		return
	}

	var req struct {
		TxHash string `json:"tx_hash" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	sponsorship, err := c.service.UpdateDepositStatus(uint(id), req.TxHash)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, sponsorship)
}

