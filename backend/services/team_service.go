package services

import (
	"errors"
	"hackathon-platform/backend/models"
	"hackathon-platform/backend/repositories"
	"time"
)

type TeamService interface {
	CreateTeam(req *CreateTeamRequest) (*models.Team, error)
	GetTeam(id uint) (*models.Team, error)
	ListTeams() ([]models.Team, error)
	GetTeamsByLeader(address string) ([]models.Team, error)
	GetTeamsByMember(address string) ([]models.Team, error)
	GetTeamsByEventID(eventID uint) ([]models.Team, error)
	GetTeamByLeaderAndEvent(leaderAddress string, eventID uint) (*models.Team, error)
	UpdateTeam(id uint, req *UpdateTeamRequest) (*models.Team, error)
	AddMember(teamID uint, req *AddMemberRequest) (*models.Team, error)
	RemoveMember(teamID uint, memberID uint) (*models.Team, error)
	ApproveTeam(id uint, organizerAddress string) (*models.Team, error)
	RejectTeam(id uint, organizerAddress string) (*models.Team, error)
	DeleteTeam(id uint) error
}

type teamService struct {
	teamRepo         repositories.TeamRepository
	eventRepo        repositories.EventRepository
	registrationRepo repositories.RegistrationRepository
}

func NewTeamService(
	teamRepo repositories.TeamRepository,
	eventRepo repositories.EventRepository,
	registrationRepo repositories.RegistrationRepository,
) TeamService {
	return &teamService{
		teamRepo:         teamRepo,
		eventRepo:        eventRepo,
		registrationRepo: registrationRepo,
	}
}

type CreateTeamRequest struct {
	EventID        uint   `json:"event_id" binding:"required"`
	Name          string   `json:"name" binding:"required"`
	Description   string   `json:"description" binding:"required"`
	LeaderAddress string   `json:"leader_address" binding:"required"`
	MaxMembers    int      `json:"max_members" binding:"required"`
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
	// Validate event exists
	_, err := s.eventRepo.GetByID(req.EventID)
	if err != nil {
		return nil, errors.New("event not found")
	}

	// Validate that leader address is in approved registrations for this event
	registrations, err := s.registrationRepo.GetByEventID(req.EventID)
	if err != nil {
		return nil, err
	}

	leaderApproved := false
	for _, reg := range registrations {
		if reg.Status == models.RegistrationStatusApproved {
			if reg.WalletAddress == req.LeaderAddress {
				leaderApproved = true
				break
			}
		}
	}

	if !leaderApproved {
		return nil, errors.New("队长钱包地址必须在此次活动审批通过的人员里面")
	}

	// Check if leader is already a leader of a team in this event
	isLeader, err := s.teamRepo.IsLeaderInEvent(req.LeaderAddress, req.EventID)
	if err != nil {
		return nil, err
	}
	if isLeader {
		return nil, errors.New("您已经是该活动中某个队伍的队长，不能重复当队长")
	}

	// Check if leader is already a member of a team in this event
	isMember, err := s.teamRepo.IsMemberInEvent(req.LeaderAddress, req.EventID)
	if err != nil {
		return nil, err
	}
	if isMember {
		return nil, errors.New("您已经是该活动中某个队伍的成员，不能重复创建队伍")
	}

	if req.MaxMembers <= 0 {
		return nil, errors.New("最大成员数必须大于0")
	}

	team := &models.Team{
		Name:          req.Name,
		Description:   req.Description,
		LeaderAddress:  req.LeaderAddress,
		MaxMembers:    req.MaxMembers,
		Skills:        req.Skills,
		Status:        models.TeamStatusApproved, // 队伍创建后直接为已批准状态
	}

	// Add members
	for _, memberReq := range req.Members {
		now := time.Now()
		member := models.TeamMember{
			Address:  memberReq.Address,
			Name:     memberReq.Name,
			Email:    memberReq.Email,
			Skills:   memberReq.Skills,
			Role:     memberReq.Role,
			JoinedAt: &now, // Set joined time to current time
		}
		team.Members = append(team.Members, member)
	}

	// Validate team size
	if len(team.Members) > team.MaxMembers {
		return nil, errors.New("team size exceeds maximum allowed")
	}

	err = s.teamRepo.Create(team)
	if err != nil {
		return nil, err
	}

	// Create registration for the team
	registration := &models.Registration{
		EventID: req.EventID,
		TeamID:  &team.ID,
		Status:  models.RegistrationStatusPending,
	}
	err = s.registrationRepo.Create(registration)
	if err != nil {
		// If registration creation fails, we should still return the team
		// but log the error
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

func (s *teamService) GetTeamsByEventID(eventID uint) ([]models.Team, error) {
	return s.teamRepo.GetByEventID(eventID)
}

func (s *teamService) GetTeamByLeaderAndEvent(leaderAddress string, eventID uint) (*models.Team, error) {
	return s.teamRepo.GetByLeaderAndEvent(leaderAddress, eventID)
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

	// Check if the address is the team leader
	if team.LeaderAddress == req.Address {
		return nil, errors.New("队长不能加入自己的队伍")
	}

	// Check if team is full
	if len(team.Members) >= team.MaxMembers {
		return nil, errors.New("队伍已满，无法加入更多成员")
	}

	// Check if member already exists
	for _, member := range team.Members {
		if member.Address == req.Address {
			return nil, errors.New("成员已在队伍中")
		}
	}

	// Get event ID from team's registration
	var eventID uint
	registrations, err := s.registrationRepo.GetByTeamID(teamID)
	if err == nil && len(registrations) > 0 {
		eventID = registrations[0].EventID
		// Validate that member address is in approved registrations for this event
		eventRegistrations, err := s.registrationRepo.GetByEventID(eventID)
		if err == nil {
			memberApproved := false
			for _, reg := range eventRegistrations {
				if reg.Status == models.RegistrationStatusApproved {
					if reg.WalletAddress == req.Address {
						memberApproved = true
						break
					}
				}
			}
			if !memberApproved {
				return nil, errors.New("队员钱包地址必须在此次活动审批通过的人员里面")
			}
		}

		// Check if member is already a leader or member of another team in this event
		isMember, err := s.teamRepo.IsMemberInEvent(req.Address, eventID)
		if err != nil {
			return nil, err
		}
		if isMember {
			return nil, errors.New("您已经是该活动中某个队伍的成员或队长，不能重复加入队伍")
		}
	}

	now := time.Now()
	member := models.TeamMember{
		TeamID:   teamID,
		Address:  req.Address,
		Name:     req.Name,
		Email:    req.Email,
		Skills:   req.Skills,
		Role:     req.Role,
		JoinedAt: &now, // Set joined time to current time
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

	// Verify that the organizerAddress is a valid organizer (has created at least one event)
	// This is a simplified check - in production, you might want more strict validation
	events, err := s.eventRepo.GetByOrganizer(organizerAddress)
	if err != nil || len(events) == 0 {
		return nil, errors.New("invalid organizer address or organizer has no events")
	}

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

	// Verify that the organizerAddress is a valid organizer (has created at least one event)
	events, err := s.eventRepo.GetByOrganizer(organizerAddress)
	if err != nil || len(events) == 0 {
		return nil, errors.New("invalid organizer address or organizer has no events")
	}

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

