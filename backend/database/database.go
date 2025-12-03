package database

import (
	"fmt"
	"hackathon-platform/backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Initialize connects to the database and runs migrations
func Initialize(databaseURL string) *gorm.DB {
	var err error
	DB, err = gorm.Open(mysql.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	// Auto migrate - order matters for foreign key constraints
	// First create base tables without foreign keys
	err = DB.AutoMigrate(
		&models.Event{},
		&models.Prize{},
		&models.Sponsor{},
		&models.FundingPool{}, // Create before Sponsorship to avoid FK constraint issues
		&models.Team{},
		&models.TeamMember{},
	)
	if err != nil {
		panic("Failed to migrate base tables: " + err.Error())
	}

	// Clean up invalid team_id references in registrations before adding foreign key constraint
	// This prevents foreign key constraint errors when team_id references non-existent teams
	// First, check if registrations table exists
	var tableExists int
	DB.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'registrations'").Scan(&tableExists)
	
	if tableExists > 0 {
		// Use multi-table UPDATE syntax which is more reliable in MySQL
		// This will set team_id to NULL for registrations where the team doesn't exist
		DB.Exec(`
			UPDATE registrations r
			LEFT JOIN teams t ON r.team_id = t.id
			SET r.team_id = NULL
			WHERE r.team_id IS NOT NULL AND t.id IS NULL
		`)
	}

	// Then create tables with foreign keys
	err = DB.AutoMigrate(
		&models.Sponsorship{}, // Has FK to FundingPool
		&models.PrizeDistribution{},
		&models.Registration{},
		&models.CheckIn{},
		&models.Submission{},
		&models.SubmissionFile{},
		&models.Vote{},
		&models.EventJudge{},
	)

	if err != nil {
		panic("Failed to migrate database: " + err.Error())
	}

	// Fix registrations table: make team_id nullable and ensure wallet_address exists
	// This is needed because GORM AutoMigrate may not modify existing NOT NULL columns
	// First, try to drop foreign key constraint if it exists
	var fkName string
	DB.Raw("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE table_schema = DATABASE() AND table_name = 'registrations' AND column_name = 'team_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1").Scan(&fkName)
	if fkName != "" {
		// Drop foreign key constraint
		DB.Exec(fmt.Sprintf("ALTER TABLE `registrations` DROP FOREIGN KEY `%s`", fkName))
		// Also try default name
		DB.Exec("ALTER TABLE `registrations` DROP FOREIGN KEY `fk_teams_registrations`")
	}
	
	// Now modify the column to allow NULL
	err = DB.Exec("ALTER TABLE `registrations` MODIFY COLUMN `team_id` INT UNSIGNED NULL").Error
	if err != nil && !contains(err.Error(), "Duplicate") && !contains(err.Error(), "doesn't exist") {
		// Log but don't panic - column might already be nullable
	}

	// Check if wallet_address column exists
	var columnExists int
	DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'registrations' AND column_name = 'wallet_address'").Scan(&columnExists)
	
	if columnExists == 0 {
		// Add wallet_address column if it doesn't exist
		err = DB.Exec("ALTER TABLE `registrations` ADD COLUMN `wallet_address` VARCHAR(255) NULL AFTER `team_id`").Error
		if err != nil {
			// Log but don't panic
		}
	}

	// Create index for wallet_address if it doesn't exist
	var indexExists int
	DB.Raw("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'registrations' AND index_name = 'idx_registrations_wallet_address'").Scan(&indexExists)
	if indexExists == 0 {
		DB.Exec("CREATE INDEX `idx_registrations_wallet_address` ON `registrations` (`wallet_address`)")
	}

	// Add max_participants column to events table if it doesn't exist
	var maxParticipantsExists int
	DB.Raw("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'events' AND column_name = 'max_participants'").Scan(&maxParticipantsExists)
	
	if maxParticipantsExists == 0 {
		// Add max_participants column with default value 0 (unlimited)
		// First add as nullable
		err = DB.Exec("ALTER TABLE `events` ADD COLUMN `max_participants` INT NOT NULL DEFAULT 0").Error
		if err != nil && !contains(err.Error(), "Duplicate") {
			// Log but don't panic
		}
	}

	return DB
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if i+len(substr) > len(s) {
			break
		}
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// Close closes the database connection
func Close(db *gorm.DB) {
	sqlDB, err := db.DB()
	if err != nil {
		return
	}
	sqlDB.Close()
}
