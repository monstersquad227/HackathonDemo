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
	
	var result struct {
		ColumnName    string
		IsNullable    string
		ColumnDefault *string
		ColumnType    string
	}
	
	err = db.Raw(`
		SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE 
		FROM INFORMATION_SCHEMA.COLUMNS 
		WHERE TABLE_SCHEMA = 'hackathon_db' 
		AND TABLE_NAME = 'team_members' 
		AND COLUMN_NAME = 'joined_at'
	`).Scan(&result).Error
	
	if err != nil {
		fmt.Printf("查询失败: %v\n", err)
		return
	}
	
	fmt.Printf("joined_at 字段信息:\n")
	fmt.Printf("  列名: %s\n", result.ColumnName)
	fmt.Printf("  可空: %s\n", result.IsNullable)
	if result.ColumnDefault != nil {
		fmt.Printf("  默认值: %s\n", *result.ColumnDefault)
	} else {
		fmt.Printf("  默认值: NULL\n")
	}
	fmt.Printf("  类型: %s\n", result.ColumnType)
}

