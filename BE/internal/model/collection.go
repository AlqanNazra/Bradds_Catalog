package domain

import "time"

type Collection struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  string    `json:"description"`
	ImageURL     string    `json:"image_url"`
	CoverMediaID *int64    `json:"cover_media_id"`
	IsActive     bool      `json:"is_active"`
	SortOrder    int       `json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
type CreateCollectionInput struct {
	Name         string `json:"name" binding:"required"`
	Slug         string `json:"slug" binding:"required"`
	Description  string `json:"description"`
	ImageURL     string `json:"image_url"`
	CoverMediaID *int64 `json:"cover_media_id"`
	IsActive     *bool  `json:"is_active"`
	SortOrder    int    `json:"sort_order"`
}
type UpdateCollectionInput struct {
	Name         string `json:"name" binding:"required"`
	Slug         string `json:"slug" binding:"required"`
	Description  string `json:"description"`
	ImageURL     string `json:"image_url"`
	CoverMediaID *int64 `json:"cover_media_id"`
	IsActive     *bool  `json:"is_active"`
	SortOrder    int    `json:"sort_order"`
}
