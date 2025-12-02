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

type TeamController struct {
	service services.TeamService
}

func NewTeamController(db *gorm.DB) *TeamController {
	teamRepo := repositories.NewTeamRepository(db)
	eventRepo := repositories.NewEventRepository(db)
	service := services.NewTeamService(teamRepo, eventRepo)
	return &TeamController{service: service}
}

// CreateTeam creates a new team
func (c *TeamController) CreateTeam(ctx *gin.Context) {
	var req services.CreateTeamRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	team, err := c.service.CreateTeam(&req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, team)
}

// ListTeams retrieves all teams
func (c *TeamController) ListTeams(ctx *gin.Context) {
	teams, err := c.service.ListTeams()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, teams)
}

// GetTeam retrieves a team by ID
func (c *TeamController) GetTeam(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid team ID"})
		return
	}

	team, err := c.service.GetTeam(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Team not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, team)
}

// GetTeamsByLeader retrieves teams by leader address
func (c *TeamController) GetTeamsByLeader(ctx *gin.Context) {
	address := ctx.Param("address")
	if address == "" {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Address is required"})
		return
	}

	teams, err := c.service.GetTeamsByLeader(address)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, teams)
}

// GetTeamsByMember retrieves teams by member address
func (c *TeamController) GetTeamsByMember(ctx *gin.Context) {
	address := ctx.Param("address")
	if address == "" {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Address is required"})
		return
	}

	teams, err := c.service.GetTeamsByMember(address)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, teams)
}

// UpdateTeam updates an existing team
func (c *TeamController) UpdateTeam(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid team ID"})
		return
	}

	var req services.UpdateTeamRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	team, err := c.service.UpdateTeam(uint(id), &req)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Team not found"})
			return
		}
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, team)
}

// AddMember adds a member to a team
func (c *TeamController) AddMember(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid team ID"})
		return
	}

	var req services.AddMemberRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	team, err := c.service.AddMember(uint(id), &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, team)
}

// RemoveMember removes a member from a team
func (c *TeamController) RemoveMember(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid team ID"})
		return
	}

	memberID, err := strconv.ParseUint(ctx.Param("memberId"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid member ID"})
		return
	}

	team, err := c.service.RemoveMember(uint(id), uint(memberID))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, team)
}

// ApproveTeam approves a team (organizer only)
func (c *TeamController) ApproveTeam(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid team ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	team, err := c.service.ApproveTeam(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, team)
}

// RejectTeam rejects a team (organizer only)
func (c *TeamController) RejectTeam(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid team ID"})
		return
	}

	var req struct {
		OrganizerAddress string `json:"organizer_address" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	team, err := c.service.RejectTeam(uint(id), req.OrganizerAddress)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, team)
}

// DeleteTeam deletes a team
func (c *TeamController) DeleteTeam(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, ErrorResponse{Error: "Invalid team ID"})
		return
	}

	err = c.service.DeleteTeam(uint(id))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, ErrorResponse{Error: "Team not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Team deleted successfully"})
}

