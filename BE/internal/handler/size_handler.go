package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/service"
	"github.com/gin-gonic/gin"
)

type SizeHandler struct {
	service *service.SizeService
}

func NewSizeHandler(
	service *service.SizeService,
) *SizeHandler {
	return &SizeHandler{service: service}
}

func (h *SizeHandler) List(c *gin.Context) {
	sizes, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch sizes",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": sizes,
	})
}

func (h *SizeHandler) GetByID(c *gin.Context) {
	id, err := parseSizeID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid size ID",
		})
		return
	}

	size, err := h.service.GetByID(
		c.Request.Context(),
		id,
	)
	if err != nil {
		if errors.Is(err, repository.ErrSizeNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "size not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch size",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": size,
	})
}

func (h *SizeHandler) Create(c *gin.Context) {
	var input domain.CreateSizeInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	size, err := h.service.Create(
		c.Request.Context(),
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidSize):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, repository.ErrSizeConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "size already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create size",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": size,
	})
}

func (h *SizeHandler) Update(c *gin.Context) {
	id, err := parseSizeID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid size ID",
		})
		return
	}

	var input domain.UpdateSizeInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	size, err := h.service.Update(
		c.Request.Context(),
		id,
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidSize):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, repository.ErrSizeNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "size not found",
			})
		case errors.Is(err, repository.ErrSizeConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "size already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to update size",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": size,
	})
}

func (h *SizeHandler) Delete(c *gin.Context) {
	id, err := parseSizeID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid size ID",
		})
		return
	}

	err = h.service.Delete(c.Request.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrSizeNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "size not found",
			})
		case errors.Is(err, repository.ErrSizeInUse):
			c.JSON(http.StatusConflict, gin.H{
				"error": "size is used by product variants",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to delete size",
			})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func parseSizeID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid size ID")
	}

	return id, nil
}
