
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
	ErrColorNotFound = errors.New("color not found")
	ErrColorConflict = errors.New("color already exists")
	ErrColorInUse    = errors.New("color is used by product variants")
)

type ColorRepository struct {
	db *pgxpool.Pool
}

func NewColorRepository(db *pgxpool.Pool) *ColorRepository {
	return &ColorRepository{db: db}
}

func (r *ColorRepository) List(ctx context.Context,) ([]domain.Color, error) {
	query := `
		SELECT id, name, hex_code, created_at, updated_at
		FROM colors
		ORDER BY name ASC, id ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list colors: %w", err)
	}
	defer rows.Close()
	colors := make([]domain.Color, 0)
	for rows.Next() {
		var color domain.Color
		if err := rows.Scan(
			&color.ID,
			&color.Name,
			&color.HexCode,
			&color.CreatedAt,
			&color.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan color: %w", err)
		}
		colors = append(colors, color)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate colors: %w", err)
	}
	return colors, nil
}

func (r *ColorRepository) GetByID(ctx context.Context,id int64,) (*domain.Color, error) {
	query := `
		SELECT id, name, hex_code, created_at, updated_at
		FROM colors
		WHERE id = $1
	`
	var color domain.Color
	err := r.db.QueryRow(ctx, query, id).Scan(
		&color.ID,
		&color.Name,
		&color.HexCode,
		&color.CreatedAt,
		&color.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrColorNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get color: %w", err)
	}
	return &color, nil
}

func (r *ColorRepository) Create(
	ctx context.Context,
	input domain.CreateColorInput,
) (*domain.Color, error) {
	query := `
		INSERT INTO colors (name, hex_code)
		VALUES ($1, $2)
		RETURNING id, name, hex_code, created_at, updated_at
	`
	var color domain.Color
	err := r.db.QueryRow(
		ctx,
		query,
		input.Name,
		input.HexCode,
	).Scan(
		&color.ID,
		&color.Name,
		&color.HexCode,
		&color.CreatedAt,
		&color.UpdatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrColorConflict
		}
		return nil, fmt.Errorf("create color: %w", err)
	}
	return &color, nil
}

func (r *ColorRepository) Update(ctx context.Context,id int64,input domain.UpdateColorInput,) (*domain.Color, error) {
	query := `
		UPDATE colors
		SET
			name = $2,
			hex_code = $3,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, hex_code, created_at, updated_at
	`
	var color domain.Color
	err := r.db.QueryRow(ctx,query,id,input.Name,input.HexCode,).Scan(
		&color.ID,
		&color.Name,
		&color.HexCode,
		&color.CreatedAt,
		&color.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrColorNotFound
	}
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrColorConflict
		}
		return nil, fmt.Errorf("update color: %w", err)
	}
	return &color, nil
}

func (r *ColorRepository) Delete(ctx context.Context,id int64,) error {
	query := `DELETE FROM colors WHERE id = $1`
	tag, err := r.db.Exec(ctx, query, id)
	if err != nil {
		if isForeignKeyViolation(err) {
			return ErrColorInUse
		}
		return fmt.Errorf("delete color: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrColorNotFound
	}
	return nil
}