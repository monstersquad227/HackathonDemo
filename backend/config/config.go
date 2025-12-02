package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		// 默认使用本地 MySQL，注意根据实际账号调整
		// 形式示例: username:password@tcp(host:3306)/dbname?parseTime=true&charset=utf8mb4&loc=Local
		databaseURL = "root:password@tcp(127.0.0.1:3306)/hackathon_db?parseTime=true&charset=utf8mb4&loc=Local"
	}

	return &Config{
		Port:        port,
		DatabaseURL: databaseURL,
	}
}

