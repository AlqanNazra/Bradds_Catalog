package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/AlqanNazra/Bradds_Catalog.git/internal/repository"
)

var ErrInvalidProduct = errors.New("invalid product input")

type ProductService struct {
	repo *repository.ProductRepository
}

func NewProductService(
	repo *repository.ProductRepository,
) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) List(
	ctx context.Context,
	limit, offset int,
	status string,
) ([]domain.Product, int64, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	if offset < 0 {
		offset = 0
	}

	status = strings.TrimSpace(status)

	if status != "" &&
		status != "ready" &&
		status != "not_ready" &&
		status != "discontinued" {
		return nil, 0, ErrInvalidProduct
	}

	return s.repo.List(ctx, limit, offset, status)
}

func (s *ProductService) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Product, error) {
	if id <= 0 {
		return nil, ErrInvalidProduct
	}

	return s.repo.GetByID(ctx, id)
}

func (s *ProductService) Create(
	ctx context.Context,
	input domain.CreateProductInput,
) (*domain.Product, error) {
	if err := validateProduct(
		&input.CategoryID,
		&input.Name,
		&input.Slug,
		&input.Price,
		&input.Status,
	); err != nil {
		return nil, err
	}

	if err := validateProductRelations(
		input.Variants,
		input.Media,
		input.CollectionIDs,
	); err != nil {
		return nil, err
	}

	return s.repo.Create(ctx, input)
}

func (s *ProductService) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateProductInput,
) (*domain.Product, error) {
	if id <= 0 {
		return nil, ErrInvalidProduct
	}

	if err := validateProduct(
		&input.CategoryID,
		&input.Name,
		&input.Slug,
		&input.Price,
		&input.Status,
	); err != nil {
		return nil, err
	}

	if err := validateProductRelations(
		input.Variants,
		input.Media,
		input.CollectionIDs,
	); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, input)
}

func (s *ProductService) Delete(
	ctx context.Context,
	id int64,
) error {
	if id <= 0 {
		return ErrInvalidProduct
	}

	return s.repo.Delete(ctx, id)
}

func validateProduct(
    categoryID *int64,
    name *string,
    slug *string,
    price *float64,
    status *string,
) error {
    if categoryID == nil || *categoryID <= 0 {
        return fmt.Errorf(
            "%w: category_id must be positive",
            ErrInvalidProduct,
        )
    }

    if name == nil || strings.TrimSpace(*name) == "" {
        return fmt.Errorf(
            "%w: name is required",
            ErrInvalidProduct,
        )
    }

    if slug == nil || strings.TrimSpace(*slug) == "" {
        return fmt.Errorf(
            "%w: slug is required",
            ErrInvalidProduct,
        )
    }

    if price == nil || *price < 0 {
        return fmt.Errorf(
            "%w: price must not be negative",
            ErrInvalidProduct,
        )
    }

    if status == nil {
        return fmt.Errorf(
            "%w: status is required",
            ErrInvalidProduct,
        )
    }

    switch *status {
    case "ready", "not_ready", "discontinued":
    default:
        return fmt.Errorf(
            "%w: invalid product status",
            ErrInvalidProduct,
        )
    }

    return nil
}

func validateVariants(
    variants []domain.CreateProductVariantInput,
) error {
    seenSKU := make(map[string]struct{})
    seenCombination := make(map[string]struct{})

    for i, v := range variants {
        sku := strings.TrimSpace(v.SKU)

        if sku == "" {
            return fmt.Errorf(
                "%w: variant %d SKU is required",
                ErrInvalidProduct,
                i,
            )
        }

        if v.ColorID <= 0 || v.SizeID <= 0 {
            return fmt.Errorf(
                "%w: variant %d has invalid color or size",
                ErrInvalidProduct,
                i,
            )
        }

        if v.Stock < 0 {
            return fmt.Errorf(
                "%w: variant %d stock must not be negative",
                ErrInvalidProduct,
                i,
            )
        }

        if v.Price < 0 {
            return fmt.Errorf(
                "%w: variant %d price must not be negative",
                ErrInvalidProduct,
                i,
            )
        }

        if _, exists := seenSKU[sku]; exists {
            return fmt.Errorf(
                "%w: duplicate SKU in request",
                ErrInvalidProduct,
            )
        }
        seenSKU[sku] = struct{}{}

        combination := fmt.Sprintf("%d-%d", v.ColorID, v.SizeID)

        if _, exists := seenCombination[combination]; exists {
            return fmt.Errorf(
                "%w: duplicate color and size combination",
                ErrInvalidProduct,
            )
        }
        seenCombination[combination] = struct{}{}
    }

    return nil
}

func validateProductRelations(
	variants []domain.CreateProductVariantInput,
	media []domain.CreateProductMediaInput,
	collectionIDs []int64,
) error {
	skus := make(map[string]bool)
	combinations := make(map[string]bool)

	for _, v := range variants {
		sku := strings.TrimSpace(v.SKU)

		if v.ColorID <= 0 ||
			v.SizeID <= 0 ||
			sku == "" ||
			v.Stock < 0 ||
			v.Price < 0 {
			return ErrInvalidProduct
		}

		if skus[sku] {
			return fmt.Errorf(
				"%w: duplicate SKU",
				ErrInvalidProduct,
			)
		}
		skus[sku] = true

		key := fmt.Sprintf(
			"%d-%d",
			v.ColorID,
			v.SizeID,
		)

		if combinations[key] {
			return fmt.Errorf(
				"%w: duplicate color and size",
				ErrInvalidProduct,
			)
		}
		combinations[key] = true
	}

	primaryCount := 0
	mediaIDs := make(map[int64]bool)

	for _, m := range media {
		if m.MediaID <= 0 || m.SortOrder < 0 {
			return ErrInvalidProduct
		}

		switch m.MediaRole {
		case "", "cover", "gallery", "video":
		default:
			return ErrInvalidProduct
		}

		if mediaIDs[m.MediaID] {
			return fmt.Errorf(
				"%w: duplicate media",
				ErrInvalidProduct,
			)
		}
		mediaIDs[m.MediaID] = true

		if m.IsPrimary {
			primaryCount++
		}
	}

	if primaryCount > 1 {
		return ErrInvalidProduct
	}

	collectionSet := make(map[int64]bool)

	for _, id := range collectionIDs {
		if id <= 0 || collectionSet[id] {
			return ErrInvalidProduct
		}
		collectionSet[id] = true
	}

	return nil
}
