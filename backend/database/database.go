package database

import (
	"hackathon-platform/backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Initialize connects to the database and runs migrations
func Initialize(databaseURL string) *gorm.DB {
	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}

	// Auto migrate
	err = DB.AutoMigrate(
		&models.Event{},
		&models.Prize{},
		&models.Sponsor{},
		&models.Sponsorship{},
		&models.FundingPool{},
		&models.PrizeDistribution{},
		&models.Team{},
		&models.TeamMember{},
		&models.Registration{},
		&models.CheckIn{},
		&models.Submission{},
		&models.SubmissionFile{},
	)

	if err != nil {
		panic("Failed to migrate database: " + err.Error())
	}

	return DB
}

// Close closes the database connection
func Close(db *gorm.DB) {
	sqlDB, err := db.DB()
	if err != nil {
		return
	}
	sqlDB.Close()
}

