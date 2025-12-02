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

type RegistrationController struct {
	service services.RegistrationService
}

func NewRegistrationController(db *gorm.DB) *RegistrationController {
	registrationRepo := repositories.NewRegistrationRepository(db)
	teamRepo := repositories.NewTeamRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	service := services.NewRegistrationService(registrationRepo, teamRepo, eventRepo)
	return &RegistrationController{service: service}
}

// CreateRegistration creates a new registration
func (c *RegistrationController) CreateRegistration(ctx *gin.Context) {
	var req services.CreateRegistrationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	registration, err := c.service.CreateRegistration(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, registration)
}

// ListRegistrationsByEvent retrieves all registrations for an event
func (c *RegistrationController) ListRegistrationsByEvent(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	registrations, err := c.service.GetRegistrationsByEvent(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registrations)
}

// GetRegistration retrieves a registration by ID
func (c *RegistrationController) GetRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	registration, err := c.service.GetRegistration(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Registration not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// ApproveRegistration approves a registration (organizer only)
func (c *RegistrationController) ApproveRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	registration, err := c.service.ApproveRegistration(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// RejectRegistration rejects a registration (organizer only)
func (c *RegistrationController) RejectRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	registration, err := c.service.RejectRegistration(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// UpdateSBTStatus updates the SBT minting status
func (c *RegistrationController) UpdateSBTStatus(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	var req struct {
		TokenID uint64 `json:"token_id" binding:"required"`
		TxHash  string `json:"tx_hash" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	registration, err := c.service.UpdateSBTStatus(uint(id), req.TokenID, req.TxHash)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, registration)
}

// DeleteRegistration deletes a registration
func (c *RegistrationController) DeleteRegistration(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid registration ID"})
		return
	}

	err = c.service.DeleteRegistration(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Registration not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Registration deleted successfully"})
}

