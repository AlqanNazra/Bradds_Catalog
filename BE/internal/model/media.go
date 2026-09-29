package domain

import "time"

// MediaAsset represents an uploaded image or video.
type MediaAsset struct {
	ID               int64     `json:"id"`
	FileURL          string    `json:"file_url"`
	StorageProvider  string    `json:"storage_provider"`
	Bucket           *string   `json:"bucket,omitempty"`
	StorageKey       *string   `json:"storage_key,omitempty"`
	MediaType        string    `json:"media_type"`
	MimeType         string    `json:"mime_type"`
	OriginalFilename string    `json:"original_filename"`
	FileSizeBytes    int64     `json:"file_size_bytes"`
	Width            *int      `json:"width,omitempty"`
	Height           *int      `json:"height,omitempty"`
	DurationSeconds  *float64  `json:"duration_seconds,omitempty"`
	PosterURL        *string   `json:"poster_url,omitempty"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CreateMediaInput contains metadata for a newly uploaded file.
type CreateMediaInput struct {
	FileURL          string
	StorageProvider  string
	Bucket           *string
	StorageKey       *string
	MediaType        string
	MimeType         string
	OriginalFilename string
	FileSizeBytes    int64
	Width            *int
	Height           *int
	DurationSeconds  *float64
	PosterURL        *string
	Status           string
}