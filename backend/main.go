package main

import (
	"hackathon-platform/backend/config"
	"hackathon-platform/backend/controllers"
	"hackathon-platform/backend/database"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	db := database.Initialize(cfg.DatabaseURL)
	defer database.Close(db)

	// Setup router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Initialize controllers
	eventController := controllers.NewEventController(db)
	sponsorController := controllers.NewSponsorController(db)
	sponsorshipController := controllers.NewSponsorshipController(db)
	fundingPoolController := controllers.NewFundingPoolController(db)
	teamController := controllers.NewTeamController(db)
	registrationController := controllers.NewRegistrationController(db)
	checkInController := controllers.NewCheckInController(db)
	submissionController := controllers.NewSubmissionController(db)

	// API routes
	api := r.Group("/api/v1")
	{
		// Events
		events := api.Group("/events")
		{
			events.POST("", eventController.CreateEvent)
			events.GET("", eventController.ListEvents)
			events.GET("/:id", eventController.GetEvent)
			events.PUT("/:id", eventController.UpdateEvent)
			events.DELETE("/:id", eventController.DeleteEvent)
			events.PATCH("/:id/stage", eventController.UpdateStage)
		}

		// Sponsors
		sponsors := api.Group("/sponsors")
		{
			sponsors.POST("", sponsorController.CreateSponsor)
			sponsors.GET("", sponsorController.ListSponsors)
			sponsors.GET("/:id", sponsorController.GetSponsor)
			sponsors.GET("/address/:address", sponsorController.GetSponsorByAddress)
			sponsors.PUT("/:id", sponsorController.UpdateSponsor)
			sponsors.DELETE("/:id", sponsorController.DeleteSponsor)
		}

		// Sponsorships
		sponsorships := api.Group("/sponsorships")
		{
			sponsorships.POST("", sponsorshipController.CreateSponsorship)
			sponsorships.GET("/event/:eventId", sponsorshipController.ListSponsorshipsByEvent)
			sponsorships.GET("/:id", sponsorshipController.GetSponsorship)
			sponsorships.PATCH("/:id/approve", sponsorshipController.ApproveSponsorship)
			sponsorships.PATCH("/:id/reject", sponsorshipController.RejectSponsorship)
			sponsorships.PATCH("/:id/deposit", sponsorshipController.UpdateDepositStatus)
		}

		// Funding Pools
		pools := api.Group("/funding-pools")
		{
			pools.POST("", fundingPoolController.CreateFundingPool)
			pools.GET("", fundingPoolController.ListFundingPools)
			pools.GET("/:id", fundingPoolController.GetFundingPool)
			pools.GET("/event/:eventId", fundingPoolController.GetFundingPoolByEvent)
			pools.PUT("/:id", fundingPoolController.UpdateFundingPool)
			pools.PATCH("/event/:eventId/lock", fundingPoolController.SetLockedUntil)
			pools.PATCH("/event/:eventId/distribute", fundingPoolController.MarkAsDistributed)
		}

		// Teams
		teams := api.Group("/teams")
		{
			teams.POST("", teamController.CreateTeam)
			teams.GET("", teamController.ListTeams)
			teams.GET("/:id", teamController.GetTeam)
			teams.GET("/leader/:address", teamController.GetTeamsByLeader)
			teams.GET("/member/:address", teamController.GetTeamsByMember)
			teams.PUT("/:id", teamController.UpdateTeam)
			teams.POST("/:id/members", teamController.AddMember)
			teams.DELETE("/:id/members/:memberId", teamController.RemoveMember)
			teams.PATCH("/:id/approve", teamController.ApproveTeam)
			teams.PATCH("/:id/reject", teamController.RejectTeam)
			teams.DELETE("/:id", teamController.DeleteTeam)
		}

		// Registrations
		registrations := api.Group("/registrations")
		{
			registrations.POST("", registrationController.CreateRegistration)
			registrations.GET("/event/:eventId", registrationController.ListRegistrationsByEvent)
			registrations.GET("/:id", registrationController.GetRegistration)
			registrations.PATCH("/:id/approve", registrationController.ApproveRegistration)
			registrations.PATCH("/:id/reject", registrationController.RejectRegistration)
			registrations.PATCH("/:id/sbt", registrationController.UpdateSBTStatus)
			registrations.DELETE("/:id", registrationController.DeleteRegistration)
		}

		// Check-ins
		checkIns := api.Group("/check-ins")
		{
			checkIns.GET("/event/:eventId/qrcode", checkInController.GenerateQRCode)
			checkIns.POST("", checkInController.CheckIn)
			checkIns.GET("/event/:eventId", checkInController.ListCheckInsByEvent)
			checkIns.GET("/event/:eventId/count", checkInController.GetCheckInCount)
			checkIns.GET("/event/:eventId/user/:address", checkInController.GetUserCheckIn)
			checkIns.GET("/:id", checkInController.GetCheckIn)
			checkIns.PATCH("/:id/tx", checkInController.UpdateTxHash)
			checkIns.DELETE("/:id", checkInController.DeleteCheckIn)
		}

		// Submissions
		submissions := api.Group("/submissions")
		{
			submissions.POST("", submissionController.CreateSubmission)
			submissions.GET("", submissionController.ListAllSubmissions)
			submissions.GET("/:id", submissionController.GetSubmission)
			submissions.GET("/event/:eventId", submissionController.ListSubmissionsByEvent)
			submissions.PUT("/:id", submissionController.UpdateSubmission)
			submissions.PATCH("/:id/approve", submissionController.ApproveSubmission)
			submissions.PATCH("/:id/reject", submissionController.RejectSubmission)
			submissions.DELETE("/:id", submissionController.DeleteSubmission)
		}
	}

	// Start server
	r.Run(":" + cfg.Port)
}

