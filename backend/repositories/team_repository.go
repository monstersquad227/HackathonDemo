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

func (r *teamRepository) Update(team *models.Team) error {
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(team).Error
}

func (r *teamRepository) Delete(id uint) error {
	return r.db.Delete(&models.Team{}, id).Error
}

