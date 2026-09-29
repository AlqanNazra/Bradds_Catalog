package domain

import "time"

type Size struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
type CreateSizeInput struct {
	Name      string `json:"name" binding:"required"`
	SortOrder int    `json:"sort_order"`
}
type UpdateSizeInput struct {
	Name      string `json:"name" binding:"required"`
	SortOrder int    `json:"sort_order"`
}
