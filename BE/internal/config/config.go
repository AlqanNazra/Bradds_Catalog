
package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppName     string
	AppEnv      string
	AppPort     string
	FrontendURL string
	StorageDir string
	StorageURL string

	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	DBMaxConns int32
	DBMinConns int32
}

func Load() (*Config, error) {
	_ = godotenv.Load()
	maxConns, err := getInt32("DB_MAX_CONNS", 10)
	if err != nil {
		return nil, err
	}
	minConns, err := getInt32("DB_MIN_CONNS", 2)
	if err != nil {
		return nil, err
	}
	if minConns < 0 || maxConns < 1 || minConns > maxConns {
		return nil, fmt.Errorf(
			"invalid database connection pool configuration",
		)
	}
	cfg := &Config{
		AppName:     getEnv("APP_NAME", "bradds-catalog"),
		AppEnv:      getEnv("APP_ENV", "development"),
		AppPort:     getEnv("APP_PORT", "8080"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     getEnv("DB_NAME", "bradds_catalog"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
		DBMaxConns: maxConns,
		DBMinConns: minConns,
		StorageDir: getEnv("STORAGE_DIR", "./uploads"),
		StorageURL: getEnv("STORAGE_URL","http://localhost:8080/uploads",),
	}
	if cfg.DBPassword == "" {
		return nil, fmt.Errorf("DB_PASSWORD is required")
	}
	return cfg, nil
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getInt32(key string, fallback int32) (int32, error) {
	value := os.Getenv(key)
	if value == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseInt(value, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid integer for %s: %w", key, err)
	}
	return int32(parsed), nil
}

