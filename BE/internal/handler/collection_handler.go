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

type CollectionHandler struct {
	service *service.CollectionService
}

func NewCollectionHandler(
	service *service.CollectionService,
) *CollectionHandler {
	return &CollectionHandler{service: service}
}

func (h *CollectionHandler) List(c *gin.Context) {
	collections, err := h.service.List(
		c.Request.Context(),
		false,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch collections",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": collections,
	})
}

func (h *CollectionHandler) AdminList(c *gin.Context) {
	collections, err := h.service.List(
		c.Request.Context(),
		true,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch collections",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": collections,
	})
}

func (h *CollectionHandler) GetByID(c *gin.Context) {
	id, err := parseCollectionID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid collection ID",
		})
		return
	}
	collection, err := h.service.GetByID(
		c.Request.Context(),
		id,
	)
	if err != nil {
		if errors.Is(err, repository.ErrCollectionNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "collection not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "failed to fetch collection",
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": collection,
	})
}

func (h *CollectionHandler) Create(c *gin.Context) {
	var input domain.CreateCollectionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}
	collection, err := h.service.Create(
		c.Request.Context(),
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCollection):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, repository.ErrCollectionConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "collection name or slug already exists",
			})
		case errors.Is(err, repository.ErrCollectionMediaNotFound):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "cover media not found",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create collection",
			})
		}
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"data": collection,
	})
}

func (h *CollectionHandler) Update(c *gin.Context) {
	id, err := parseCollectionID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid collection ID",
		})
		return
	}
	var input domain.UpdateCollectionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
		})
		return
	}
	collection, err := h.service.Update(
		c.Request.Context(),
		id,
		input,
	)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCollection):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": err.Error(),
			})
		case errors.Is(err, repository.ErrCollectionNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "collection not found",
			})
		case errors.Is(err, repository.ErrCollectionConflict):
			c.JSON(http.StatusConflict, gin.H{
				"error": "collection name or slug already exists",
			})
		case errors.Is(err, repository.ErrCollectionMediaNotFound):
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "cover media not found",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to update collection",
			})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": collection,
	})
}

func (h *CollectionHandler) Delete(c *gin.Context) {
	id, err := parseCollectionID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid collection ID",
		})
		return
	}

	err = h.service.Delete(c.Request.Context(), id)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrCollectionNotFound):
			c.JSON(http.StatusNotFound, gin.H{
				"error": "collection not found",
			})
		case errors.Is(err, repository.ErrCollectionInUse):
			c.JSON(http.StatusConflict, gin.H{
				"error": "collection is used by products",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to delete collection",
			})
		}
		return
	}
	c.Status(http.StatusNoContent)
}

func parseCollectionID(c *gin.Context) (int64, error) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid collection ID")
	}
	return id, nil
}
