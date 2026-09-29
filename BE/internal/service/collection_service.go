package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
	"regexp"
	"strings"
)

var ErrInvalidCollection = errors.New("invalid collection input")

var collectionSlugPattern = regexp.MustCompile(
	`^[a-z0-9]+(?:-[a-z0-9]+)*$`,
)

type CollectionService struct {
	repo *repository.CollectionRepository
}

func NewCollectionService(
	repo *repository.CollectionRepository,
) *CollectionService {
	return &CollectionService{repo: repo}
}

func (s *CollectionService) List(
	ctx context.Context,
	includeInactive bool,
) ([]domain.Collection, error) {
	return s.repo.List(ctx, includeInactive)
}

func (s *CollectionService) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Collection, error) {
	if id <= 0 {
		return nil, ErrInvalidCollection
	}

	return s.repo.GetByID(ctx, id)
}

func (s *CollectionService) Create(
	ctx context.Context,
	input domain.CreateCollectionInput,
) (*domain.Collection, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.Slug = strings.ToLower(strings.TrimSpace(input.Slug))
	input.Description = strings.TrimSpace(input.Description)
	input.ImageURL = strings.TrimSpace(input.ImageURL)

	if input.Name == "" ||
		!collectionSlugPattern.MatchString(input.Slug) ||
		input.SortOrder < 0 {
		return nil, ErrInvalidCollection
	}

	if input.IsActive == nil {
		active := true
		input.IsActive = &active
	}

	if input.CoverMediaID != nil &&
		*input.CoverMediaID <= 0 {
		return nil, fmt.Errorf(
			"%w: invalid cover_media_id",
			ErrInvalidCollection,
		)
	}

	return s.repo.Create(ctx, input)
}

func (s *CollectionService) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateCollectionInput,
) (*domain.Collection, error) {
	if id <= 0 {
		return nil, ErrInvalidCollection
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Slug = strings.ToLower(strings.TrimSpace(input.Slug))
	input.Description = strings.TrimSpace(input.Description)
	input.ImageURL = strings.TrimSpace(input.ImageURL)

	if input.Name == "" ||
		!collectionSlugPattern.MatchString(input.Slug) ||
		input.SortOrder < 0 ||
		input.IsActive == nil {
		return nil, ErrInvalidCollection
	}

	if input.CoverMediaID != nil &&
		*input.CoverMediaID <= 0 {
		return nil, fmt.Errorf(
			"%w: invalid cover_media_id",
			ErrInvalidCollection,
		)
	}

	return s.repo.Update(ctx, id, input)
}

func (s *CollectionService) Delete(
	ctx context.Context,
	id int64,
) error {
	if id <= 0 {
		return ErrInvalidCollection
	}

	return s.repo.Delete(ctx, id)
}
