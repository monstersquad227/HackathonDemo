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

	fmt.Println("开始修改 registrations 表结构...")

	// 首先查找并删除外键约束（如果存在）
	var fkName string
	err = db.Raw("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE table_schema = DATABASE() AND table_name = 'registrations' AND column_name = 'team_id' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1").Scan(&fkName).Error
	
	if err == nil && fkName != "" {
		fmt.Printf("  找到外键约束: %s，正在删除...\n", fkName)
		err = db.Exec(fmt.Sprintf("ALTER TABLE `registrations` DROP FOREIGN KEY `%s`", fkName)).Error
		if err != nil {
			fmt.Printf("  ⚠️  删除外键约束失败: %v\n", err)
			// 尝试使用默认的约束名称
			err = db.Exec("ALTER TABLE `registrations` DROP FOREIGN KEY `fk_teams_registrations`").Error
			if err != nil {
				fmt.Printf("  ⚠️  使用默认名称删除外键约束也失败: %v\n", err)
			} else {
				fmt.Println("  ✅ 外键约束已删除")
			}
		} else {
			fmt.Println("  ✅ 外键约束已删除")
		}
	} else {
		fmt.Println("  未找到外键约束，跳过删除步骤")
	}

	// 修改 team_id 列，允许 NULL
	err = db.Exec("ALTER TABLE `registrations` MODIFY COLUMN `team_id` INT UNSIGNED NULL").Error
	if err != nil {
		// 检查是否是因为列已经是 NULL 或者列不存在
		if contains(err.Error(), "Duplicate column name") || contains(err.Error(), "doesn't exist") {
			fmt.Println("  team_id 列可能已经是 NULL 或不存在，跳过")
		} else {
			fmt.Printf("  ⚠️  修改 team_id 列失败: %v\n", err)
			panic(err)
		}
	} else {
		fmt.Println("  ✅ team_id 列已修改为允许 NULL")
	}

	// 注意：由于 team_id 现在可以为 NULL，我们不重新创建外键约束
	// 如果需要外键约束，可以在应用层进行验证

	// 确保 wallet_address 列存在（如果不存在则添加）
	err = db.Exec("ALTER TABLE `registrations` ADD COLUMN `wallet_address` VARCHAR(255) NULL AFTER `team_id`").Error
	if err != nil {
		// 如果列已存在，忽略错误
		if contains(err.Error(), "Duplicate column name") {
			fmt.Println("  wallet_address 列已存在，跳过")
		} else {
			fmt.Printf("  ⚠️  添加 wallet_address 列失败: %v\n", err)
			// 不 panic，因为列可能已经存在
		}
	} else {
		fmt.Println("  ✅ wallet_address 列已添加")
	}

	// 为 wallet_address 添加索引（如果不存在）
	// 先检查索引是否存在
	var indexExists int
	db.Raw("SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'registrations' AND index_name = 'idx_registrations_wallet_address'").Scan(&indexExists)
	
	if indexExists == 0 {
		err = db.Exec("CREATE INDEX `idx_registrations_wallet_address` ON `registrations` (`wallet_address`)").Error
		if err != nil {
			fmt.Printf("  ⚠️  创建 wallet_address 索引失败: %v\n", err)
		} else {
			fmt.Println("  ✅ wallet_address 索引已创建")
		}
	} else {
		fmt.Println("  wallet_address 索引已存在，跳过")
	}

	fmt.Println("\n数据库迁移完成！")
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

