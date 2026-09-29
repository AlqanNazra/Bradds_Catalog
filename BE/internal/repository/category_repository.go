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
	ErrCategoryNotFound = errors.New("category not found")
	ErrCategoryConflict = errors.New("category name or slug already exists")
)

type CategoryRepository struct {
	db *pgxpool.Pool
}

func NewCategoryRepository(db *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) List(
	ctx context.Context,
	includeInactive bool,
) ([]domain.Category, error) {
	query := `
		SELECT
			id, name, slug, description, image_url,
			is_active, created_at, updated_at
		FROM categories
		WHERE ($1 OR is_active = TRUE)
		ORDER BY created_at DESC, id DESC
	`

	rows, err := r.db.Query(ctx, query, includeInactive)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()

	categories := make([]domain.Category, 0)

	for rows.Next() {
		var category domain.Category

		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Slug,
			&category.Description,
			&category.ImageURL,
			&category.IsActive,
			&category.CreatedAt,
			&category.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}

		categories = append(categories, category)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate categories: %w", err)
	}

	return categories, nil
}

func (r *CategoryRepository) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Category, error) {
	query := `
		SELECT
			id, name, slug, description, image_url,
			is_active, created_at, updated_at
		FROM categories
		WHERE id = $1
	`

	var category domain.Category

	err := r.db.QueryRow(ctx, query, id).Scan(
		&category.ID,
		&category.Name,
		&category.Slug,
		&category.Description,
		&category.ImageURL,
		&category.IsActive,
		&category.CreatedAt,
		&category.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCategoryNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("get category: %w", err)
	}

	return &category, nil
}

func (r *CategoryRepository) Create(
	ctx context.Context,
	input domain.CreateCategoryInput,
) (*domain.Category, error) {
	query := `
		INSERT INTO categories (
			name, slug, description, image_url, is_active
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING
			id, name, slug, description, image_url,
			is_active, created_at, updated_at
	`

	var category domain.Category

	err := r.db.QueryRow(
		ctx,
		query,
		input.Name,
		input.Slug,
		input.Description,
		input.ImageURL,
		*input.IsActive,
	).Scan(
		&category.ID,
		&category.Name,
		&category.Slug,
		&category.Description,
		&category.ImageURL,
		&category.IsActive,
		&category.CreatedAt,
		&category.UpdatedAt,
	)

	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrCategoryConflict
		}
		return nil, fmt.Errorf("create category: %w", err)
	}

	return &category, nil
}

func (r *CategoryRepository) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateCategoryInput,
) (*domain.Category, error) {
	query := `
		UPDATE categories
		SET
			name = $2,
			slug = $3,
			description = $4,
			image_url = $5,
			is_active = $6
		WHERE id = $1
		RETURNING
			id, name, slug, description, image_url,
			is_active, created_at, updated_at
	`

	var category domain.Category

	err := r.db.QueryRow(
		ctx,
		query,
		id,
		input.Name,
		input.Slug,
		input.Description,
		input.ImageURL,
		*input.IsActive,
	).Scan(
		&category.ID,
		&category.Name,
		&category.Slug,
		&category.Description,
		&category.ImageURL,
		&category.IsActive,
		&category.CreatedAt,
		&category.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrCategoryNotFound
	}

	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrCategoryConflict
		}
		return nil, fmt.Errorf("update category: %w", err)
	}

	return &category, nil
}

func (r *CategoryRepository) Delete(
	ctx context.Context,
	id int64,
) error {
	query := `DELETE FROM categories WHERE id = $1`

	tag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		if isForeignKeyViolation(err) {
			return fmt.Errorf(
				"category is still used by products: %w",
				err,
			)
		}
		return fmt.Errorf("delete category: %w", err)
	}

	if tag.RowsAffected() == 0 {
		return ErrCategoryNotFound
	}

	return nil
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func isForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23503"
}
