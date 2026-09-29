package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
)

var ErrInvalidSize = errors.New("invalid size input")

type SizeService struct {
	repo *repository.SizeRepository
}

func NewSizeService(
	repo *repository.SizeRepository,
) *SizeService {
	return &SizeService{repo: repo}
}

func (s *SizeService) List(
	ctx context.Context,
) ([]domain.Size, error) {
	return s.repo.List(ctx)
}

func (s *SizeService) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Size, error) {
	if id <= 0 {
		return nil, ErrInvalidSize
	}

	return s.repo.GetByID(ctx, id)
}

func (s *SizeService) Create(
	ctx context.Context,
	input domain.CreateSizeInput,
) (*domain.Size, error) {
	input.Name = strings.TrimSpace(input.Name)

	if input.Name == "" || input.SortOrder < 0 {
		return nil, ErrInvalidSize
	}

	return s.repo.Create(ctx, input)
}

func (s *SizeService) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateSizeInput,
) (*domain.Size, error) {
	if id <= 0 {
		return nil, ErrInvalidSize
	}

	input.Name = strings.TrimSpace(input.Name)

	if input.Name == "" || input.SortOrder < 0 {
		return nil, ErrInvalidSize
	}

	return s.repo.Update(ctx, id, input)
}

func (s *SizeService) Delete(
	ctx context.Context,
	id int64,
) error {
	if id <= 0 {
		return fmt.Errorf("%w: invalid ID", ErrInvalidSize)
	}

	return s.repo.Delete(ctx, id)
}
