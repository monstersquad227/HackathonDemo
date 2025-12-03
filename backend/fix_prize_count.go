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

	fmt.Println("开始修复奖项count字段...")

	// 首先检查count字段是否存在，如果不存在则添加
	fmt.Println("检查count字段是否存在...")
	var columnExists bool
	err = db.Raw(`
		SELECT COUNT(*) > 0 
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() 
		AND TABLE_NAME = 'prizes' 
		AND COLUMN_NAME = 'count'
	`).Scan(&columnExists).Error
	
	if err != nil {
		fmt.Printf("⚠️  检查字段失败: %v\n", err)
	} else if !columnExists {
		fmt.Println("count字段不存在，正在添加...")
		// 添加count字段，默认值为1
		err = db.Exec("ALTER TABLE `prizes` ADD COLUMN `count` INT NOT NULL DEFAULT 1").Error
		if err != nil {
			fmt.Printf("❌ 添加字段失败: %v\n", err)
			return
		}
		fmt.Println("✅ count字段已添加")
	} else {
		fmt.Println("✅ count字段已存在")
	}

	// 更新所有count为0或NULL的记录为1（默认值）
	fmt.Println("更新count为0或NULL的记录...")
	result := db.Exec("UPDATE `prizes` SET `count` = 1 WHERE `count` IS NULL OR `count` = 0")
	if result.Error != nil {
		fmt.Printf("❌ 更新失败: %v\n", result.Error)
		return
	}

	fmt.Printf("✅ 已更新 %d 条记录的count字段为1\n", result.RowsAffected)
	fmt.Println("修复完成！")
}
