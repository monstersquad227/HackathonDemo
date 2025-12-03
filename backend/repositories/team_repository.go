package repositories

import (
	"hackathon-platform/backend/models"

	"gorm.io/gorm"
)

type TeamRepository interface {
	Create(team *models.Team) error
	GetByID(id uint) (*models.Team, error)
	GetAll() ([]models.Team, error)
	GetByLeaderAddress(address string) ([]models.Team, error)
	GetByMemberAddress(address string) ([]models.Team, error)
	GetByEventID(eventID uint) ([]models.Team, error)
	GetByLeaderAndEvent(leaderAddress string, eventID uint) (*models.Team, error)
	IsLeaderInEvent(leaderAddress string, eventID uint) (bool, error)
	IsMemberInEvent(memberAddress string, eventID uint) (bool, error)
	Update(team *models.Team) error
	Delete(id uint) error
}

type teamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) TeamRepository {
	return &teamRepository{db: db}
}

func (r *teamRepository) Create(team *models.Team) error {
	// 保存成员列表
	members := team.Members
	team.Members = nil
	
	// 先创建团队（不包含成员）
	if err := r.db.Create(team).Error; err != nil {
		return err
	}
	
	// 然后单独创建每个成员，使用原生 SQL 确保 JoinedAt 被正确设置
	for i := range members {
		members[i].TeamID = team.ID
		// 使用原生 SQL 插入，确保 joined_at 使用 NOW()
		err := r.db.Exec(`
			INSERT INTO team_members (team_id, user_id, address, name, email, skills, role, joined_at, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
		`, members[i].TeamID, members[i].UserID, members[i].Address, members[i].Name, 
			members[i].Email, members[i].Skills, members[i].Role).Error
		if err != nil {
			return err
		}
	}
	
	// 重新加载团队以包含成员
	return r.db.Preload("Members").First(team, team.ID).Error
}

func (r *teamRepository) GetByID(id uint) (*models.Team, error) {
	var team models.Team
	err := r.db.Preload("Members").Preload("Registrations.Event").First(&team, id).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

func (r *teamRepository) GetAll() ([]models.Team, error) {
	var teams []models.Team
	err := r.db.Preload("Members").Preload("Registrations.Event").Find(&teams).Error
	return teams, err
}

func (r *teamRepository) GetByLeaderAddress(address string) ([]models.Team, error) {
	var teams []models.Team
	err := r.db.Preload("Members").Preload("Registrations.Event").
		Where("leader_address = ?", address).Find(&teams).Error
	return teams, err
}

func (r *teamRepository) GetByMemberAddress(address string) ([]models.Team, error) {
	var teams []models.Team
	err := r.db.Preload("Members").Preload("Registrations.Event").
		Joins("JOIN team_members ON team_members.team_id = teams.id").
		Where("team_members.address = ?", address).
		Find(&teams).Error
	return teams, err
}

func (r *teamRepository) GetByEventID(eventID uint) ([]models.Team, error) {
	var teams []models.Team
	// First, get all team IDs from registrations for this event
	var teamIDs []uint
	err := r.db.Table("registrations").
		Where("event_id = ? AND team_id IS NOT NULL", eventID).
		Pluck("team_id", &teamIDs).Error
	if err != nil {
		return nil, err
	}
	if len(teamIDs) == 0 {
		return teams, nil
	}
	// Then, get all teams with those IDs
	err = r.db.Preload("Members").Preload("Registrations.Event").
		Where("id IN ?", teamIDs).
		Find(&teams).Error
	return teams, err
}

// GetByLeaderAndEvent gets a team by leader address and event ID
func (r *teamRepository) GetByLeaderAndEvent(leaderAddress string, eventID uint) (*models.Team, error) {
	var team models.Team
	err := r.db.Preload("Members").Preload("Registrations.Event").
		Joins("JOIN registrations ON registrations.team_id = teams.id").
		Where("teams.leader_address = ? AND registrations.event_id = ?", leaderAddress, eventID).
		First(&team).Error
	if err != nil {
		return nil, err
	}
	return &team, nil
}

// IsLeaderInEvent checks if a leader is already a leader of a team in the event
func (r *teamRepository) IsLeaderInEvent(leaderAddress string, eventID uint) (bool, error) {
	var count int64
	err := r.db.Table("teams").
		Joins("JOIN registrations ON registrations.team_id = teams.id").
		Where("teams.leader_address = ? AND registrations.event_id = ?", leaderAddress, eventID).
		Count(&count).Error
	return count > 0, err
}

// IsMemberInEvent checks if a member is already a member or leader of a team in the event
func (r *teamRepository) IsMemberInEvent(memberAddress string, eventID uint) (bool, error) {
	var count int64
	// Check if member is a leader of any team in the event
	err := r.db.Table("teams").
		Joins("JOIN registrations ON registrations.team_id = teams.id").
		Where("teams.leader_address = ? AND registrations.event_id = ?", memberAddress, eventID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	if count > 0 {
		return true, nil
	}
	// Check if member is a member of any team in the event
	err = r.db.Table("team_members").
		Joins("JOIN teams ON teams.id = team_members.team_id").
		Joins("JOIN registrations ON registrations.team_id = teams.id").
		Where("team_members.address = ? AND registrations.event_id = ?", memberAddress, eventID).
		Count(&count).Error
	return count > 0, err
}

func (r *teamRepository) Update(team *models.Team) error {
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(team).Error
}

func (r *teamRepository) Delete(id uint) error {
	return r.db.Delete(&models.Team{}, id).Error
}

