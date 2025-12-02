package services

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
)

type TeamService interface {
	CreateTeam(req *CreateTeamRequest) (*models.Team, error)
	GetTeam(id uint) (*models.Team, error)
	ListTeams() ([]models.Team, error)
	GetTeamsByLeader(address string) ([]models.Team, error)
	GetTeamsByMember(address string) ([]models.Team, error)
	UpdateTeam(id uint, req *UpdateTeamRequest) (*models.Team, error)
	AddMember(teamID uint, req *AddMemberRequest) (*models.Team, error)
	RemoveMember(teamID uint, memberID uint) (*models.Team, error)
	ApproveTeam(id uint, organizerAddress string) (*models.Team, error)
	RejectTeam(id uint, organizerAddress string) (*models.Team, error)
	DeleteTeam(id uint) error
}

type teamService struct {
	teamRepo       repositories.TeamRepository
	eventRepo      repositories.EventRepository
}

func NewTeamService(
	teamRepo repositories.TeamRepository,
	eventRepo repositories.EventRepository,
) TeamService {
	return &teamService{
		teamRepo:  teamRepo,
		eventRepo: eventRepo,
	}
}

type CreateTeamRequest struct {
	Name          string   `json:"name" binding:"required"`
	Description   string   `json:"description"`
	LeaderAddress string   `json:"leader_address" binding:"required"`
	MaxMembers    int      `json:"max_members"`
	Skills        string   `json:"skills"`
	Members       []CreateMemberRequest `json:"members"`
}

type CreateMemberRequest struct {
	Address string `json:"address" binding:"required"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Skills  string `json:"skills"`
	Role    string `json:"role"`
}

type UpdateTeamRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	MaxMembers  *int    `json:"max_members"`
	Skills      *string `json:"skills"`
}

type AddMemberRequest struct {
	Address string `json:"address" binding:"required"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Skills  string `json:"skills"`
	Role    string `json:"role"`
}

func (s *teamService) CreateTeam(req *CreateTeamRequest) (*models.Team, error) {
	if req.MaxMembers <= 0 {
		req.MaxMembers = 5 // Default max members
	}

	team := &models.Team{
		Name:          req.Name,
		Description:   req.Description,
		LeaderAddress:  req.LeaderAddress,
		MaxMembers:    req.MaxMembers,
		Skills:        req.Skills,
		Status:        models.TeamStatusPending,
	}

	// Add members
	for _, memberReq := range req.Members {
		member := models.TeamMember{
			Address: memberReq.Address,
			Name:    memberReq.Name,
			Email:   memberReq.Email,
			Skills:  memberReq.Skills,
			Role:    memberReq.Role,
		}
		team.Members = append(team.Members, member)
	}

	// Validate team size
	if len(team.Members) > team.MaxMembers {
		return nil, errors.New("team size exceeds maximum allowed")
	}

	err := s.teamRepo.Create(team)
	if err != nil {
		return nil, err
	}

	return team, nil
}

func (s *teamService) GetTeam(id uint) (*models.Team, error) {
	return s.teamRepo.GetByID(id)
}

func (s *teamService) ListTeams() ([]models.Team, error) {
	return s.teamRepo.GetAll()
}

func (s *teamService) GetTeamsByLeader(address string) ([]models.Team, error) {
	return s.teamRepo.GetByLeaderAddress(address)
}

func (s *teamService) GetTeamsByMember(address string) ([]models.Team, error) {
	return s.teamRepo.GetByMemberAddress(address)
}

func (s *teamService) UpdateTeam(id uint, req *UpdateTeamRequest) (*models.Team, error) {
	team, err := s.teamRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		team.Name = *req.Name
	}
	if req.Description != nil {
		team.Description = *req.Description
	}
	if req.MaxMembers != nil {
		if *req.MaxMembers < len(team.Members) {
			return nil, errors.New("cannot set max members less than current member count")
		}
		team.MaxMembers = *req.MaxMembers
	}
	if req.Skills != nil {
		team.Skills = *req.Skills
	}

	err = s.teamRepo.Update(team)
	if err != nil {
		return nil, err
	}

	return team, nil
}

func (s *teamService) AddMember(teamID uint, req *AddMemberRequest) (*models.Team, error) {
	team, err := s.teamRepo.GetByID(teamID)
	if err != nil {
		return nil, err
	}

	// Check if team is full
	if len(team.Members) >= team.MaxMembers {
		return nil, errors.New("team is full")
	}

	// Check if member already exists
	for _, member := range team.Members {
		if member.Address == req.Address {
			return nil, errors.New("member already in team")
		}
	}

	member := models.TeamMember{
		TeamID:  teamID,
		Address: req.Address,
		Name:    req.Name,
		Email:   req.Email,
		Skills:  req.Skills,
		Role:    req.Role,
	}
	team.Members = append(team.Members, member)

	err = s.teamRepo.Update(team)
	if err != nil {
		return nil, err
	}

	return team, nil
}

func (s *teamService) RemoveMember(teamID uint, memberID uint) (*models.Team, error) {
	team, err := s.teamRepo.GetByID(teamID)
	if err != nil {
		return nil, err
	}

	// Find and remove member
	found := false
	for i, member := range team.Members {
		if member.ID == memberID {
			team.Members = append(team.Members[:i], team.Members[i+1:]...)
			found = true
			break
		}
	}

	if !found {
		return nil, errors.New("member not found")
	}

	err = s.teamRepo.Update(team)
	if err != nil {
		return nil, err
	}

	return team, nil
}

func (s *teamService) ApproveTeam(id uint, organizerAddress string) (*models.Team, error) {
	team, err := s.teamRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Note: In a real implementation, you would verify organizerAddress against event organizer
	// For now, we'll just approve the team
	team.Status = models.TeamStatusApproved
	err = s.teamRepo.Update(team)
	if err != nil {
		return nil, err
	}

	return team, nil
}

func (s *teamService) RejectTeam(id uint, organizerAddress string) (*models.Team, error) {
	team, err := s.teamRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Note: In a real implementation, you would verify organizerAddress against event organizer
	team.Status = models.TeamStatusRejected
	err = s.teamRepo.Update(team)
	if err != nil {
		return nil, err
	}

	return team, nil
}

func (s *teamService) DeleteTeam(id uint) error {
	return s.teamRepo.Delete(id)
}

