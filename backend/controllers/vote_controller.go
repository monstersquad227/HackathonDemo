package controllers

import (
	"hackathon-platform/backend/repositories"
	"hackathon-platform/backend/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// VoteController wires HTTP handlers to the vote service.
type VoteController struct {
	service services.VoteService
}

// NewVoteController builds a VoteController with all dependencies.
func NewVoteController(db *gorm.DB) *VoteController {
	voteRepo := repositories.NewVoteRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	submissionRepo := repositories.NewSubmissionRepository(db)
	eventJudgeRepo := repositories.NewEventJudgeRepository(db)
	sponsorRepo := repositories.NewSponsorRepository(db)
	sponsorshipRepo := repositories.NewSponsorshipRepository(db)
	service := services.NewVoteService(voteRepo, eventRepo, submissionRepo, eventJudgeRepo, sponsorRepo, sponsorshipRepo)
	return &VoteController{service: service}
}

// CastVote handles POST /votes
func (c *VoteController) CastVote(ctx *gin.Context) {
	var req services.CastVoteRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	vote, err := c.service.CastVote(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, vote)
}

// ListVotesByEvent handles GET /votes/event/:eventId
func (c *VoteController) ListVotesByEvent(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid event ID"})
		return
	}

	votes, err := c.service.ListVotesByEvent(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, votes)
}

// ListVotesBySubmission handles GET /votes/submission/:submissionId
func (c *VoteController) ListVotesBySubmission(ctx *gin.Context) {
	submissionID, err := strconv.ParseUint(ctx.Param("submissionId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid submission ID"})
		return
	}

	votes, err := c.service.ListVotesBySubmission(uint(submissionID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, votes)
}

// GetVote handles GET /votes/:id
func (c *VoteController) GetVote(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid vote ID"})
		return
	}

	vote, err := c.service.GetVote(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, vote)
}

// DeleteVote handles DELETE /votes/:id
func (c *VoteController) DeleteVote(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid vote ID"})
		return
	}

	organizerAddress := ctx.Query("organizer_address")
	if organizerAddress == "" {
		var body struct {
			OrganizerAddress string `json:"organizer_address"`
		}
		if err := ctx.ShouldBindJSON(&body); err == nil {
			organizerAddress = body.OrganizerAddress
		}
	}

	if organizerAddress == "" {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "organizer_address is required"})
		return
	}

	if err := c.service.DeleteVote(uint(id), organizerAddress); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "vote deleted"})
}

// GetEventSummary handles GET /votes/event/:eventId/summary
func (c *VoteController) GetEventSummary(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid event ID"})
		return
	}

	summary, err := c.service.GetEventSummary(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, summary)
}

// AddJudge handles POST /events/:eventId/judges
func (c *VoteController) AddJudge(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid event ID"})
		return
	}

	var req services.AddJudgeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	judge, err := c.service.AddJudge(uint(eventID), &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, judge)
}

// ListJudges handles GET /events/:eventId/judges
func (c *VoteController) ListJudges(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid event ID"})
		return
	}

	judges, err := c.service.ListJudges(uint(eventID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, judges)
}

// RemoveJudge handles DELETE /events/:eventId/judges/:judgeId
func (c *VoteController) RemoveJudge(ctx *gin.Context) {
	eventID, err := strconv.ParseUint(ctx.Param("eventId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid event ID"})
		return
	}

	judgeID, err := strconv.ParseUint(ctx.Param("judgeId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "invalid judge ID"})
		return
	}

	var body struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	if err := c.service.RemoveJudge(uint(eventID), uint(judgeID), body.OrganizerAddress); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "judge removed"})
}



