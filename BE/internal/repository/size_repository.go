package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrSizeNotFound = errors.New("size not found")
	ErrSizeConflict = errors.New("size already exists")
	ErrSizeInUse    = errors.New("size is used by product variants")
)

type SizeRepository struct {
	db *pgxpool.Pool
}

func NewSizeRepository(db *pgxpool.Pool) *SizeRepository {
	return &SizeRepository{db: db}
}

func (r *SizeRepository) List(
	ctx context.Context,
) ([]domain.Size, error) {
	query := `
		SELECT id, name, sort_order, created_at, updated_at
		FROM sizes
		ORDER BY sort_order ASC, id ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list sizes: %w", err)
	}
	defer rows.Close()

	sizes := make([]domain.Size, 0)

	for rows.Next() {
		var size domain.Size

		if err := rows.Scan(
			&size.ID,
			&size.Name,
			&size.SortOrder,
			&size.CreatedAt,
			&size.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan size: %w", err)
		}

		sizes = append(sizes, size)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate sizes: %w", err)
	}

	return sizes, nil
}

func (r *SizeRepository) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Size, error) {
	query := `
		SELECT id, name, sort_order, created_at, updated_at
		FROM sizes
		WHERE id = $1
	`

	var size domain.Size

	err := r.db.QueryRow(ctx, query, id).Scan(
		&size.ID,
		&size.Name,
		&size.SortOrder,
		&size.CreatedAt,
		&size.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrSizeNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("get size: %w", err)
	}

	return &size, nil
}

func (r *SizeRepository) Create(
	ctx context.Context,
	input domain.CreateSizeInput,
) (*domain.Size, error) {
	query := `
		INSERT INTO sizes (name, sort_order)
		VALUES ($1, $2)
		RETURNING id, name, sort_order, created_at, updated_at
	`

	var size domain.Size

	err := r.db.QueryRow(
		ctx,
		query,
		input.Name,
		input.SortOrder,
	).Scan(
		&size.ID,
		&size.Name,
		&size.SortOrder,
		&size.CreatedAt,
		&size.UpdatedAt,
	)

	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrSizeConflict
		}

		return nil, fmt.Errorf("create size: %w", err)
	}

	return &size, nil
}

func (r *SizeRepository) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateSizeInput,
) (*domain.Size, error) {
	query := `
		UPDATE sizes
		SET
			name = $2,
			sort_order = $3,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, sort_order, created_at, updated_at
	`

	var size domain.Size

	err := r.db.QueryRow(
		ctx,
		query,
		id,
		input.Name,
		input.SortOrder,
	).Scan(
		&size.ID,
		&size.Name,
		&size.SortOrder,
		&size.CreatedAt,
		&size.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrSizeNotFound
	}

	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrSizeConflict
		}

		return nil, fmt.Errorf("update size: %w", err)
	}

	return &size, nil
}

func (r *SizeRepository) Delete(
	ctx context.Context,
	id int64,
) error {
	query := `DELETE FROM sizes WHERE id = $1`

	tag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		if isForeignKeyViolation(err) {
			return ErrSizeInUse
		}

		return fmt.Errorf("delete size: %w", err)
	}

	if tag.RowsAffected() == 0 {
		return ErrSizeNotFound
	}

	return nil
}
