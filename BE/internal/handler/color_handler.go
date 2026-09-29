
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

type ColorHandler struct {
	service *service.ColorService
}

func NewColorHandler(
	service *service.ColorService,
) *ColorHandler {
	return &ColorHandler{service: service}
}

func (h *ColorHandler) List(c *gin.Context) {
	colors, err := h.service.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch colors",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": colors,
	})
}

func (h *ColorHandler) GetByID(c *gin.Context) {
	id, err := parseColorID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid color ID",
		})
		return
	}

	color, err := h.service.GetByID(
		c.Request.Context(),
		id,
	)
	if err != nil {
		if errors.Is(err, repository.ErrColorNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "color not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch color",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": color,
	})
}

func (h *ColorHandler) Create(c *gin.Context) {
	var input domain.CreateColorInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	color, err := h.service.Create(
		c.Request.Context(),
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidColor):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, repository.ErrColorConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "color already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create color",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": color,
	})
}

func (h *ColorHandler) Update(c *gin.Context) {
	id, err := parseColorID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid color ID",
		})
		return
	}

	var input domain.UpdateColorInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	color, err := h.service.Update(
		c.Request.Context(),
		id,
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidColor):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, repository.ErrColorNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "color not found",
			})
		case errors.Is(err, repository.ErrColorConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "color already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to update color",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": color,
	})
}

func (h *ColorHandler) Delete(c *gin.Context) {
	id, err := parseColorID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid color ID",
		})
		return
	}

	err = h.service.Delete(c.Request.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrColorNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "color not found",
			})
		case errors.Is(err, repository.ErrColorInUse):
			c.JSON(http.StatusConflict, gin.H{
				"error": "color is used by product variants",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to delete color",
			})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func parseColorID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid color ID")
	}

	return id, nil
}