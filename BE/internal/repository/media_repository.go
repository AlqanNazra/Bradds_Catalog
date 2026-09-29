package repository

import (
	"context"
	"fmt"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MediaRepository struct {
	db *pgxpool.Pool
}

func NewMediaRepository(db *pgxpool.Pool) *MediaRepository {
	return &MediaRepository{
		db: db,
	}
}

func (r *MediaRepository) Create(
	ctx context.Context,
	input domain.CreateMediaInput,
) (*domain.MediaAsset, error) {
	query := `
		INSERT INTO media_assets (
			file_url,
			storage_provider,
			bucket,
			storage_key,
			media_type,
			mime_type,
			original_filename,
			file_size_bytes,
			width,
			height,
			duration_seconds,
			poster_url,
			status
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13
		)
		RETURNING
			id,
			file_url,
			storage_provider,
			bucket,
			storage_key,
			media_type,
			mime_type,
			original_filename,
			file_size_bytes,
			width,
			height,
			duration_seconds,
			poster_url,
			status,
			created_at,
			updated_at
	`

	var media domain.MediaAsset

	err := r.db.QueryRow(
		ctx,
		query,
		input.FileURL,
		input.StorageProvider,
		input.Bucket,
		input.StorageKey,
		input.MediaType,
		input.MimeType,
		input.OriginalFilename,
		input.FileSizeBytes,
		input.Width,
		input.Height,
		input.DurationSeconds,
		input.PosterURL,
		input.Status,
	).Scan(
		&media.ID,
		&media.FileURL,
		&media.StorageProvider,
		&media.Bucket,
		&media.StorageKey,
		&media.MediaType,
		&media.MimeType,
		&media.OriginalFilename,
		&media.FileSizeBytes,
		&media.Width,
		&media.Height,
		&media.DurationSeconds,
		&media.PosterURL,
		&media.Status,
		&media.CreatedAt,
		&media.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("create media asset: %w", err)
	}

	return &media, nil
}