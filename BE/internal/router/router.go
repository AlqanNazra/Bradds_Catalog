package router

import (
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/config"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/handler"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/storage"
)

func Setup(cfg *config.Config, db *pgxpool.Pool) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	healthHandler := handler.NewHealthHandler(db)
	categoryRepo := repository.NewCategoryRepository(db)
	categoryService := service.NewCategoryService(categoryRepo)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	colorRepo := repository.NewColorRepository(db)
	colorService := service.NewColorService(colorRepo)
	colorHandler := handler.NewColorHandler(colorService)
	sizeRepo := repository.NewSizeRepository(db)
	sizeService := service.NewSizeService(sizeRepo)
	sizeHandler := handler.NewSizeHandler(sizeService)
	collectionRepo := repository.NewCollectionRepository(db)
	collectionService := service.NewCollectionService(collectionRepo)
	collectionHandler := handler.NewCollectionHandler(collectionService)
	productRepo := repository.NewProductRepository(db)
	productService := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productService)
	mediaRepo := repository.NewMediaRepository(db)
	mediaStorage := storage.NewLocalStorage(cfg.StorageDir,cfg.StorageURL,)
	mediaService := service.NewMediaService(mediaRepo,mediaStorage,)

	mediaHandler := handler.NewMediaHandler(mediaService)

	api := r.Group("/api")
	{
		api.GET("/health", healthHandler.Check)
		api.GET("/categories", categoryHandler.List)
		api.GET("/categories/:id", categoryHandler.GetByID)
		api.GET("/collections", collectionHandler.List)
		admin := api.Group("/admin")
		{
			// Categories
			admin.GET("/categories", categoryHandler.AdminList)
			admin.POST("/categories", categoryHandler.Create)
			admin.PUT("/categories/:id", categoryHandler.Update)
			admin.DELETE("/categories/:id", categoryHandler.Delete)
			// Colors
			admin.GET("/colors", colorHandler.List)
			admin.GET("/colors/:id", colorHandler.GetByID)
			admin.POST("/colors", colorHandler.Create)
			admin.PUT("/colors/:id", colorHandler.Update)
			admin.DELETE("/colors/:id", colorHandler.Delete)
			// Sizes
			admin.GET("/sizes", sizeHandler.List)
			admin.GET("/sizes/:id", sizeHandler.GetByID)
			admin.POST("/sizes", sizeHandler.Create)
			admin.PUT("/sizes/:id", sizeHandler.Update)
			admin.DELETE("/sizes/:id", sizeHandler.Delete)
			// Collections
			admin.GET("/collections", collectionHandler.AdminList)
			admin.GET("/collections/:id", collectionHandler.GetByID)
			admin.POST("/collections", collectionHandler.Create)
			admin.PUT("/collections/:id", collectionHandler.Update)
			admin.DELETE("/collections/:id", collectionHandler.Delete)
			// Products
			admin.GET("/products", productHandler.List)
			admin.GET("/products/:id", productHandler.GetByID)
			admin.POST("/products", productHandler.Create)
			admin.PUT("/products/:id", productHandler.Update)
			admin.DELETE("/products/:id", productHandler.Delete)
			// Media
			admin.POST("/media", mediaHandler.Upload)
		}
	}
	// Serve uploaded media files.
	r.Static("/uploads", cfg.StorageDir)

	return r
}
