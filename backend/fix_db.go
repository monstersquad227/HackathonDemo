package main

import (
	"hackathon-platform/backend/config"
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()
	
	// 直接连接数据库，不触发迁移
	db, err := gorm.Open(mysql.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to database: " + err.Error())
	}
	
	sqlDB, err := db.DB()
	if err != nil {
		panic("Failed to get database connection: " + err.Error())
	}
	defer sqlDB.Close()

	// 删除错误的外键约束
	fmt.Println("删除错误的外键约束...")
	err = db.Exec("ALTER TABLE `sponsorships` DROP FOREIGN KEY `fk_funding_pools_sponsorships`").Error
	if err != nil {
		// 如果外键不存在，忽略错误
		if !contains(err.Error(), "1091") {
			fmt.Printf("警告: 删除外键约束时出错 (可能不存在): %v\n", err)
		} else {
			fmt.Println("外键约束已删除或不存在")
		}
	} else {
		fmt.Println("✅ 外键约束删除成功")
	}

	// 修复 joined_at 字段 - 先检查字段是否存在，然后修改
	fmt.Println("修复 joined_at 字段...")
	
	// 先尝试删除可能存在的 NOT NULL 约束
	err = db.Exec("ALTER TABLE `team_members` MODIFY COLUMN `joined_at` datetime(3) NULL").Error
	if err != nil {
		fmt.Printf("⚠️  修改字段失败，尝试其他方法: %v\n", err)
		// 如果字段不存在或类型不匹配，尝试添加字段
		err2 := db.Exec("ALTER TABLE `team_members` ADD COLUMN `joined_at` datetime(3) NULL").Error
		if err2 != nil && !contains(err2.Error(), "Duplicate column") {
			fmt.Printf("❌ 添加字段也失败: %v\n", err2)
		} else {
			fmt.Println("✅ joined_at 字段已添加或已存在")
		}
	} else {
		fmt.Println("✅ joined_at 字段修复成功（允许 NULL）")
	}
	
	// 更新现有 NULL 值为当前时间（可选）
	fmt.Println("更新现有 NULL 值...")
	err = db.Exec("UPDATE `team_members` SET `joined_at` = NOW() WHERE `joined_at` IS NULL").Error
	if err != nil {
		fmt.Printf("⚠️  更新现有值失败（可能没有 NULL 值）: %v\n", err)
	} else {
		fmt.Println("✅ 现有 NULL 值已更新")
	}

	fmt.Println("\n数据库修复完成！")
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || 
		(len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || 
		containsSubstring(s, substr))))
}

func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

