package handler

import (
	"errors"
	"log"
	"net/http"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/service"
	"github.com/gin-gonic/gin"
)

type MediaHandler struct {
	service *service.MediaService
}

func NewMediaHandler(
	mediaService *service.MediaService,
) *MediaHandler {
	return &MediaHandler{
		service: mediaService,
	}
}

func (h *MediaHandler) Upload(c *gin.Context) {
	// Limit request body to 6 MB.
	// This includes multipart overhead.
	c.Request.Body = http.MaxBytesReader(
		c.Writer,
		c.Request.Body,
		6<<20,
	)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		if errors.Is(err, http.ErrBodyReadAfterClose) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "failed to read uploaded file",
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "file is required (field: file)",
		})
		return
	}
	media, err := h.service.Upload(
		c.Request.Context(),
		fileHeader,
	)
	if err != nil {
		log.Printf("[MediaHandler.Upload] error: %+v", err)
		switch {
		case errors.Is(err, service.ErrInvalidMedia):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid image; allowed formats: JPEG, PNG, WebP",
			})
		case errors.Is(err, service.ErrMediaTooLarge):
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": "image size must not exceed 5 MB",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to upload media",
			})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"data": media,
	})
}