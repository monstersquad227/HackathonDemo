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

type SubmissionController struct {
	service services.SubmissionService
}

func NewSubmissionController(db *gorm.DB) *SubmissionController {
	submissionRepo := repositories.NewSubmissionRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	teamRepo := repositories.NewTeamRepository(db)
	service := services.NewSubmissionService(submissionRepo, eventRepo, teamRepo)
	return &SubmissionController{service: service}
}

// CreateSubmission handles project submission
func (c *SubmissionController) CreateSubmission(ctx *gin.Context) {
	var req services.CreateSubmissionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	submission, err := c.service.CreateSubmission(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, submission)
}

// ListSubmissionsByEvent returns submissions for a specific event
func (c *SubmissionController) ListSubmissionsByEvent(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid event ID"})
		return
	}

	submissions, err := c.service.ListSubmissionsByEvent(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, submissions)
}

// ListAllSubmissions returns all submissions
func (c *SubmissionController) ListAllSubmissions(ctx *gin.Context) {
	submissions, err := c.service.ListAllSubmissions()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, submissions)
}

// GetSubmission returns a submission by ID
func (c *SubmissionController) GetSubmission(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid submission ID"})
		return
	}

	submission, err := c.service.GetSubmission(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Submission not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, submission)
}

// UpdateSubmission updates submission details
func (c *SubmissionController) UpdateSubmission(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid submission ID"})
		return
	}

	var req services.UpdateSubmissionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	submission, err := c.service.UpdateSubmission(uint(id), &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, submission)
}

// ApproveSubmission approves a submission
func (c *SubmissionController) ApproveSubmission(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid submission ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
		Comment          string `json:"comment"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	submission, err := c.service.ApproveSubmission(uint(id), req.OrganizerAddress, req.Comment)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, submission)
}

// RejectSubmission rejects a submission
func (c *SubmissionController) RejectSubmission(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid submission ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
		Comment          string `json:"comment"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	submission, err := c.service.RejectSubmission(uint(id), req.OrganizerAddress, req.Comment)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, submission)
}

// DeleteSubmission deletes a submission
func (c *SubmissionController) DeleteSubmission(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid submission ID"})
		return
	}

	err = c.service.DeleteSubmission(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Submission not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Submission deleted successfully"})
}
