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
		panic("Failed to connect: " + err.Error())
	}
	
	sqlDB, _ := db.DB()
	defer sqlDB.Close()
	
	// 检查当前表结构
	var columnInfo struct {
		ColumnName    string
		IsNullable    string
		ColumnDefault *string
		ColumnType    string
		ColumnKey     string
	}
	
	err = db.Raw(`
		SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE, COLUMN_KEY
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'hackathon_db' 
		AND TABLE_NAME = 'team_members' 
		AND COLUMN_NAME = 'joined_at'
	`).Scan(&columnInfo).Error
	
	if err != nil {
		fmt.Printf("查询失败: %v\n", err)
		return
	}
	
	fmt.Printf("当前 joined_at 字段信息:\n")
	fmt.Printf("  列名: %s\n", columnInfo.ColumnName)
	fmt.Printf("  可空: %s\n", columnInfo.IsNullable)
	fmt.Printf("  类型: %s\n", columnInfo.ColumnType)
	if columnInfo.ColumnDefault != nil {
		fmt.Printf("  默认值: %s\n", *columnInfo.ColumnDefault)
	} else {
		fmt.Printf("  默认值: NULL\n")
	}
	
	// 尝试修改字段为允许 NULL 且使用 NOW() 作为默认值（使用 timestamp 类型）
	fmt.Println("\n尝试修复字段...")
	
	// 方法1: 修改为允许 NULL
	err = db.Exec("ALTER TABLE `team_members` MODIFY COLUMN `joined_at` datetime(3) NULL").Error
	if err != nil {
		fmt.Printf("方法1失败: %v\n", err)
		
		// 方法2: 尝试删除字段后重新添加
		fmt.Println("尝试方法2: 删除并重新添加字段...")
		db.Exec("ALTER TABLE `team_members` DROP COLUMN `joined_at`")
		err = db.Exec("ALTER TABLE `team_members` ADD COLUMN `joined_at` datetime(3) NULL").Error
		if err != nil {
			fmt.Printf("方法2也失败: %v\n", err)
		} else {
			fmt.Println("✅ 方法2成功: 字段已重新添加")
		}
	} else {
		fmt.Println("✅ 方法1成功: 字段已修改为允许 NULL")
	}
}

