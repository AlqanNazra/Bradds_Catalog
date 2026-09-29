package repository

import (
	"context"
	"errors"
	"fmt"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrCollectionNotFound      = errors.New("collection not found")
	ErrCollectionConflict      = errors.New("collection name or slug already exists")
	ErrCollectionInUse         = errors.New("collection is used by products")
	ErrCollectionMediaNotFound = errors.New("cover media not found")
)

type CollectionRepository struct {
	db *pgxpool.Pool
}

func NewCollectionRepository(db *pgxpool.Pool) *CollectionRepository {
	return &CollectionRepository{db: db}
}

const collectionColumns = `
	id, name, slug, description, image_url,
	cover_media_id, is_active, sort_order,
	created_at, updated_at
`

func (r *CollectionRepository) List(
	ctx context.Context,
	includeInactive bool,
) ([]domain.Collection, error) {
	query := `
		SELECT ` + collectionColumns + `
		FROM collections
		WHERE ($1 OR is_active = TRUE)
		ORDER BY sort_order ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query, includeInactive)
	if err != nil {
		return nil, fmt.Errorf("list collections: %w", err)
	}
	defer rows.Close()
	collections := make([]domain.Collection, 0)
	for rows.Next() {
		var collection domain.Collection
		if err := rows.Scan(
			&collection.ID,
			&collection.Name,
			&collection.Slug,
			&collection.Description,
			&collection.ImageURL,
			&collection.CoverMediaID,
			&collection.IsActive,
			&collection.SortOrder,
			&collection.CreatedAt,
			&collection.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan collection: %w", err)
		}
		collections = append(collections, collection)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate collections: %w", err)
	}
	return collections, nil
}

func (r *CollectionRepository) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Collection, error) {
	query := `
		SELECT ` + collectionColumns + `
		FROM collections
		WHERE id = $1
	`
	var collection domain.Collection
	err := r.db.QueryRow(ctx, query, id).Scan(
		&collection.ID,
		&collection.Name,
		&collection.Slug,
		&collection.Description,
		&collection.ImageURL,
		&collection.CoverMediaID,
		&collection.IsActive,
		&collection.SortOrder,
		&collection.CreatedAt,
		&collection.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCollectionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get collection: %w", err)
	}
	return &collection, nil
}

func (r *CollectionRepository) Create(
	ctx context.Context,
	input domain.CreateCollectionInput,
) (*domain.Collection, error) {
	query := `
		INSERT INTO collections (
			name, slug, description, image_url,
			cover_media_id, is_active, sort_order
		)
		VALUES (
			$1, $2, $3, $4, $5,
			COALESCE($6, TRUE), $7
		)
		RETURNING ` + collectionColumns
	var collection domain.Collection
	err := r.db.QueryRow(
		ctx,
		query,
		input.Name,
		input.Slug,
		input.Description,
		input.ImageURL,
		input.CoverMediaID,
		input.IsActive,
		input.SortOrder,
	).Scan(
		&collection.ID,
		&collection.Name,
		&collection.Slug,
		&collection.Description,
		&collection.ImageURL,
		&collection.CoverMediaID,
		&collection.IsActive,
		&collection.SortOrder,
		&collection.CreatedAt,
		&collection.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrCollectionConflict
		}
		if isForeignKeyViolation(err) {
			return nil, ErrCollectionMediaNotFound
		}
		return nil, fmt.Errorf("create collection: %w", err)
	}
	return &collection, nil
}

func (r *CollectionRepository) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateCollectionInput,
) (*domain.Collection, error) {
	query := `
		UPDATE collections
		SET
			name = $2,
			slug = $3,
			description = $4,
			image_url = $5,
			cover_media_id = $6,
			is_active = $7,
			sort_order = $8,
			updated_at = NOW()
		WHERE id = $1
		RETURNING ` + collectionColumns
	var collection domain.Collection
	err := r.db.QueryRow(
		ctx,
		query,
		id,
		input.Name,
		input.Slug,
		input.Description,
		input.ImageURL,
		input.CoverMediaID,
		*input.IsActive,
		input.SortOrder,
	).Scan(
		&collection.ID,
		&collection.Name,
		&collection.Slug,
		&collection.Description,
		&collection.ImageURL,
		&collection.CoverMediaID,
		&collection.IsActive,
		&collection.SortOrder,
		&collection.CreatedAt,
		&collection.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCollectionNotFound
	}
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrCollectionConflict
		}
		if isForeignKeyViolation(err) {
			return nil, ErrCollectionMediaNotFound
		}
		return nil, fmt.Errorf("update collection: %w", err)
	}
	return &collection, nil
}

func (r *CollectionRepository) Delete(
	ctx context.Context,
	id int64,
) error {
	query := `DELETE FROM collections WHERE id = $1`
	tag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		if isForeignKeyViolation(err) {
			return ErrCollectionInUse
		}
		return fmt.Errorf("delete collection: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrCollectionNotFound
	}
	return nil
}

var _ *pgconn.PgError
