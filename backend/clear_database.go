package main

import (
	"hackathon-platform/backend/config"
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()
	
	db, err := gorm.Open(mysql.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}
	
	sqlDB, err := db.DB()
	if err != nil {
		panic("Failed to get database connection: " + err.Error())
	}
	defer sqlDB.Close()

	fmt.Println("开始清空数据库...")

	// 禁用外键检查
	db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	defer db.Exec("SET FOREIGN_KEY_CHECKS = 1")

	// 按依赖关系顺序删除表数据
	tables := []string{
		"votes",
		"event_judges",
		"submission_files",
		"submissions",
		"check_ins",
		"registrations",
		"team_members",
		"teams",
		"prize_distributions",
		"sponsorships",
		"funding_pools",
		"prizes",
		"events",
		"sponsors",
	}

	for _, table := range tables {
		fmt.Printf("清空表: %s...\n", table)
		err := db.Exec(fmt.Sprintf("TRUNCATE TABLE `%s`", table)).Error
		if err != nil {
			// 如果表不存在，尝试删除表
			if contains(err.Error(), "doesn't exist") || contains(err.Error(), "Unknown table") {
				fmt.Printf("  表 %s 不存在，跳过\n", table)
			} else {
				fmt.Printf("  ⚠️  清空表 %s 失败: %v\n", table, err)
			}
		} else {
			fmt.Printf("  ✅ 表 %s 已清空\n", table)
		}
	}

	fmt.Println("\n数据库清空完成！")
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

