package handler

import (
	"errors"
	"log"
	"net/http"
	"strconv"

	domain "github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/service"
	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	service *service.ProductService
}

func NewProductHandler(
	service *service.ProductService,
) *ProductHandler {
	return &ProductHandler{service: service}
}

func (h *ProductHandler) List(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	status := c.Query("status")

	products, total, err := h.service.List(
		c.Request.Context(),
		limit,
		offset,
		status,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": products,
		"meta": gin.H{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	id, err := parseProductID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid product ID",
		})
		return
	}

	product, err := h.service.GetByID(
		c.Request.Context(),
		id,
	)
	if err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "product not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch product",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": product,
	})
}

func (h *ProductHandler) Create(c *gin.Context) {
	var input domain.CreateProductInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	product, err := h.service.Create(
		c.Request.Context(),
		input,
	)
	if err != nil {
		log.Printf("[ProductHandler.Create] error: %+v", err)

		switch {
		case errors.Is(err, service.ErrInvalidProduct):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})

		case errors.Is(err, repository.ErrProductConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "product slug or SKU already exists",
			})

		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create product",
			})
		}

		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": product,
	})
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, err := parseProductID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid product ID",
		})
		return
	}

	var input domain.UpdateProductInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}

	product, err := h.service.Update(
		c.Request.Context(),
		id,
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidProduct):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, repository.ErrProductNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "product not found",
			})
		case errors.Is(err, repository.ErrProductConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "product slug or SKU already exists",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to update product",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": product,
	})
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := parseProductID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid product ID",
		})
		return
	}

	err = h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "product not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to delete product",
		})
		return
	}

	c.Status(http.StatusNoContent)
}

func parseProductID(c *gin.Context) (int64, error) {
	return strconv.ParseInt(c.Param("id"), 10, 64)
}
