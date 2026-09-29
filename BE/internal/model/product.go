package domain

import "time"

// Product represents the main product information.
type Product struct {
	ID              int64     `json:"id"`
	CategoryID      int64     `json:"category_id"`
	Name            string    `json:"name"`
	Slug            string    `json:"slug"`
	Description     string    `json:"description"`
	Price           float64   `json:"price"`
	Material        string    `json:"material"`
	CareInstruction string    `json:"care_instruction"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	Variants    []ProductVariant `json:"variants,omitempty"`
	Media       []ProductMedia   `json:"media,omitempty"`
	Collections []int64          `json:"collection_ids,omitempty"`
}

// ProductVariant represents a product's color-size combination.
type ProductVariant struct {
	ID        int64     `json:"id"`
	ProductID int64     `json:"product_id"`
	ColorID   int64     `json:"color_id"`
	SizeID    int64     `json:"size_id"`
	SKU       string    `json:"sku"`
	Stock     int       `json:"stock"`
	Price     float64   `json:"price"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
type ProductMedia struct {
	ID        int64     `json:"id"`
	ProductID int64     `json:"product_id"`
	MediaID   int64     `json:"media_id"`
	MediaRole string    `json:"media_role"`
	SortOrder int       `json:"sort_order"`
	IsPrimary bool      `json:"is_primary"`
	AltText   string    `json:"alt_text"`
	CreatedAt time.Time `json:"created_at"`
	FileURL   string    `json:"file_url,omitempty"`
	MediaType string    `json:"media_type,omitempty"`
}
type CreateProductInput struct {
	CategoryID      int64                       `json:"category_id" binding:"required"`
	Name            string                      `json:"name" binding:"required"`
	Slug            string                      `json:"slug" binding:"required"`
	Description     string                      `json:"description"`
	Price           float64                     `json:"price"`
	Material        string                      `json:"material"`
	CareInstruction string                      `json:"care_instruction"`
	Status          string                      `json:"status"`
	Variants        []CreateProductVariantInput `json:"variants"`
	Media           []CreateProductMediaInput   `json:"media"`
	CollectionIDs   []int64                     `json:"collection_ids"`
}
type UpdateProductInput struct {
	CategoryID      int64   `json:"category_id" binding:"required"`
	Name            string  `json:"name" binding:"required"`
	Slug            string  `json:"slug" binding:"required"`
	Description     string  `json:"description"`
	Price           float64 `json:"price"`
	Material        string  `json:"material"`
	CareInstruction string  `json:"care_instruction"`
	Status          string  `json:"status"`

	Variants      []CreateProductVariantInput `json:"variants"`
	Media         []CreateProductMediaInput   `json:"media"`
	CollectionIDs []int64                     `json:"collection_ids"`
}
type CreateProductVariantInput struct {
	ColorID  int64   `json:"color_id" binding:"required"`
	SizeID   int64   `json:"size_id" binding:"required"`
	SKU      string  `json:"sku" binding:"required"`
	Stock    int     `json:"stock"`
	Price    float64 `json:"price"`
	IsActive *bool   `json:"is_active"`
}
type CreateProductMediaInput struct {
	MediaID   int64  `json:"media_id" binding:"required"`
	MediaRole string `json:"media_role"`
	SortOrder int    `json:"sort_order"`
	IsPrimary bool   `json:"is_primary"`
	AltText   string `json:"alt_text"`
}
