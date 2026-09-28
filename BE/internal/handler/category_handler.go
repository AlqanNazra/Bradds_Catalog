
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

type CategoryHandler struct {
	service *service.CategoryService
}

func NewCategoryHandler(
	service *service.CategoryService,
) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.service.List(
		c.Request.Context(),
		false,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch categories",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": categories,
	})
}

func (h *CategoryHandler) AdminList(c *gin.Context) {
	categories, err := h.service.List(
		c.Request.Context(),
		true,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch categories",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": categories,
	})
}

func (h *CategoryHandler) GetByID(c *gin.Context) {
	id, err := parseCategoryID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid category ID",
		})
		return
	}

	category, err := h.service.GetByID(
		c.Request.Context(),
		id,
	)
	if err != nil {
		if errors.Is(err, repository.ErrCategoryNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "category not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch category",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": category,
	})
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var input domain.CreateCategoryInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	category, err := h.service.Create(
		c.Request.Context(),
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCategory):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid category name or slug",
			})
		case errors.Is(err, repository.ErrCategoryConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "category name or slug already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create category",
			})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": category,
	})
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := parseCategoryID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid category ID",
		})
		return
	}

	var input domain.UpdateCategoryInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	category, err := h.service.Update(
		c.Request.Context(),
		id,
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCategory):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "invalid category input",
			})
		case errors.Is(err, repository.ErrCategoryNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "category not found",
			})
		case errors.Is(err, repository.ErrCategoryConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "category name or slug already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to update category",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": category,
	})
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, err := parseCategoryID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid category ID",
		})
		return
	}

	err = h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrCategoryNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "category not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to delete category",
		})
		return
	}

	c.Status(http.StatusNoContent)
}

func parseCategoryID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid category ID")
	}

	return id, nil
}