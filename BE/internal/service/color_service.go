
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
var (ErrInvalidColor = errors.New("invalid color input"))
var hexColorPattern = regexp.MustCompile(`^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$`,)
type ColorService struct {
	repo *repository.ColorRepository
}
func NewColorService(repo *repository.ColorRepository,) *ColorService {
	return &ColorService{repo: repo}
}
func (s *ColorService) List(ctx context.Context,) ([]domain.Color, error) {
	return s.repo.List(ctx)
}

func (s *ColorService) GetByID(ctx context.Context,id int64,) (*domain.Color, error) {
	if id <= 0 {
		return nil, ErrInvalidColor
	}
	return s.repo.GetByID(ctx, id)
}

func (s *ColorService) Create(ctx context.Context,input domain.CreateColorInput,) (*domain.Color, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.HexCode = strings.TrimSpace(input.HexCode)

	if input.Name == "" {
		return nil, ErrInvalidColor
	}

	if input.HexCode == "" {
		input.HexCode = "#000000"
	}

	if !hexColorPattern.MatchString(input.HexCode) {
		return nil, fmt.Errorf(
			"%w: hex_code must be #RGB or #RRGGBB",
			ErrInvalidColor,
		)
	}

	input.HexCode = strings.ToUpper(input.HexCode)

	if len(input.HexCode) == 4 {
		input.HexCode = fmt.Sprintf(
			"#%c%c%c%c%c%c",
			input.HexCode[1], input.HexCode[1],
			input.HexCode[2], input.HexCode[2],
			input.HexCode[3], input.HexCode[3],
		)
	}

	return s.repo.Create(ctx, input)
}

func (s *ColorService) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateColorInput,
) (*domain.Color, error) {
	if id <= 0 {
		return nil, ErrInvalidColor
	}

	input.Name = strings.TrimSpace(input.Name)
	input.HexCode = strings.TrimSpace(input.HexCode)

	if input.Name == "" {
		return nil, ErrInvalidColor
	}

	if input.HexCode == "" {
		input.HexCode = "#000000"
	}

	if !hexColorPattern.MatchString(input.HexCode) {
		return nil, fmt.Errorf(
			"%w: hex_code must be #RGB or #RRGGBB",
			ErrInvalidColor,
		)
	}

	input.HexCode = strings.ToUpper(input.HexCode)

	if len(input.HexCode) == 4 {
		input.HexCode = fmt.Sprintf(
			"#%c%c%c%c%c%c",
			input.HexCode[1], input.HexCode[1],
			input.HexCode[2], input.HexCode[2],
			input.HexCode[3], input.HexCode[3],
		)
	}

	return s.repo.Update(ctx, id, input)
}

func (s *ColorService) Delete(
	ctx context.Context,
	id int64,
) error {
	if id <= 0 {
		return ErrInvalidColor
	}

	return s.repo.Delete(ctx, id)
}