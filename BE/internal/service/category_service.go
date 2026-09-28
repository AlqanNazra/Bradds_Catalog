
package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
)

var (
	ErrInvalidCategory = errors.New("invalid category input")
)

var slugPattern = regexp.MustCompile(
	`^[a-z0-9]+(?:-[a-z0-9]+)*$`,
)

type CategoryService struct {
	repo *repository.CategoryRepository
}

func NewCategoryService(
	repo *repository.CategoryRepository,
) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) List(
	ctx context.Context,
	includeInactive bool,
) ([]domain.Category, error) {
	return s.repo.List(ctx, includeInactive)
}

func (s *CategoryService) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Category, error) {
	if id <= 0 {
		return nil, ErrInvalidCategory
	}

	return s.repo.GetByID(ctx, id)
}

func (s *CategoryService) Create(
	ctx context.Context,
	input domain.CreateCategoryInput,
) (*domain.Category, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.Slug = strings.TrimSpace(
		strings.ToLower(input.Slug),
	)
	input.Description = strings.TrimSpace(input.Description)
	input.ImageURL = strings.TrimSpace(input.ImageURL)

	if input.Name == "" || !slugPattern.MatchString(input.Slug) {
		return nil, ErrInvalidCategory
	}

	if input.IsActive == nil {
		active := true
		input.IsActive = &active
	}

	return s.repo.Create(ctx, input)
}

func (s *CategoryService) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateCategoryInput,
) (*domain.Category, error) {
	if id <= 0 {
		return nil, ErrInvalidCategory
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Slug = strings.TrimSpace(
		strings.ToLower(input.Slug),
	)
	input.Description = strings.TrimSpace(input.Description)
	input.ImageURL = strings.TrimSpace(input.ImageURL)

	if input.Name == "" || !slugPattern.MatchString(input.Slug) {
		return nil, ErrInvalidCategory
	}

	if input.IsActive == nil {
		return nil, fmt.Errorf(
			"%w: is_active is required for update",
			ErrInvalidCategory,
		)
	}

	return s.repo.Update(ctx, id, input)
}

func (s *CategoryService) Delete(
	ctx context.Context,
	id int64,
) error {
	if id <= 0 {
		return ErrInvalidCategory
	}

	return s.repo.Delete(ctx, id)
}