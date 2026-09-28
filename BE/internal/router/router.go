
package router

import (
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/config"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/handler"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/service"
)

func Setup(cfg *config.Config, db *pgxpool.Pool) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Health check
	healthHandler := handler.NewHealthHandler(db)

	// Category dependencies
	categoryRepo := repository.NewCategoryRepository(db)
	categoryService := service.NewCategoryService(categoryRepo)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	// API routes
	api := r.Group("/api")
	{
		api.GET("/health", healthHandler.Check)

		// Public category endpoints
		api.GET("/categories", categoryHandler.List)
		api.GET("/categories/:id", categoryHandler.GetByID)

		// Admin category endpoints
		admin := api.Group("/admin")
		{
			admin.GET("/categories", categoryHandler.AdminList)
			admin.POST("/categories", categoryHandler.Create)
			admin.PUT("/categories/:id", categoryHandler.Update)
			admin.DELETE("/categories/:id", categoryHandler.Delete)
		}
	}

	return r
}