package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	domain "github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrProductConflict = errors.New("product slug or SKU already exists")
)

func isProductUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError

	return errors.As(err, &pgErr) &&
		pgErr.Code == "23505"
}

func isProductForeignKeyViolation(err error) bool {
	var pgErr *pgconn.PgError

	return errors.As(err, &pgErr) &&
		pgErr.Code == "23503"
}

type ProductRepository struct {
	db *pgxpool.Pool
}

func NewProductRepository(db *pgxpool.Pool) *ProductRepository {
	return &ProductRepository{db: db}
}

// List returns products with pagination.
func insertProductRelations(
	ctx context.Context,
	tx pgx.Tx,
	productID int64,
	variants []domain.CreateProductVariantInput,
	media []domain.CreateProductMediaInput,
	collectionIDs []int64,
) error {
	// Insert product variants.
	for _, v := range variants {
		sku := strings.TrimSpace(v.SKU)

		isActive := true
		if v.IsActive != nil {
			isActive = *v.IsActive
		}

		_, err := tx.Exec(ctx, `
            INSERT INTO product_variants (
                product_id,
                color_id,
                size_id,
                sku,
                stock,
                price,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
			productID,
			v.ColorID,
			v.SizeID,
			sku,
			v.Stock,
			v.Price,
			isActive,
		)

		if err != nil {
			return fmt.Errorf("insert product variant: %w", err)
		}
	}

	// Insert product media.
	for _, m := range media {
		role := strings.TrimSpace(m.MediaRole)

		if role == "" {
			role = "gallery"
		}

		_, err := tx.Exec(ctx, `
            INSERT INTO product_media (
                product_id,
                media_id,
                media_role,
                sort_order,
                is_primary,
                alt_text
            )
            VALUES ($1, $2, $3, $4, $5, $6)
        `,
			productID,
			m.MediaID,
			role,
			m.SortOrder,
			m.IsPrimary,
			strings.TrimSpace(m.AltText),
		)

		if err != nil {
			return fmt.Errorf("insert product media: %w", err)
		}
	}

	// Insert product collections.
	for _, collectionID := range collectionIDs {
		_, err := tx.Exec(ctx, `
            INSERT INTO product_collections (
                product_id,
                collection_id
            )
            VALUES ($1, $2)
        `,
			productID,
			collectionID,
		)

		if err != nil {
			return fmt.Errorf("insert product collection: %w", err)
		}
	}

	return nil
}

func (r *ProductRepository) Create(
	ctx context.Context,
	input domain.CreateProductInput,
) (*domain.Product, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin create product: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `
        INSERT INTO products (
            category_id,
            name,
            slug,
            description,
            price,
            material,
            care_instruction,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
    `

	var productID int64

	err = tx.QueryRow(
		ctx,
		query,
		input.CategoryID,
		strings.TrimSpace(input.Name),
		strings.TrimSpace(input.Slug),
		input.Description,
		input.Price,
		input.Material,
		input.CareInstruction,
		input.Status,
	).Scan(&productID)

	if err != nil {
		if isProductUniqueViolation(err) {
			return nil, ErrProductConflict
		}

		return nil, fmt.Errorf("insert product: %w", err)
	}

	err = insertProductRelations(
		ctx,
		tx,
		productID,
		input.Variants,
		input.Media,
		input.CollectionIDs,
	)

	if err != nil {
		if isProductUniqueViolation(err) {
			return nil, ErrProductConflict
		}

		if isProductForeignKeyViolation(err) {
			return nil, fmt.Errorf(
				"invalid product relation: %w",
				err,
			)
		}

		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		if isProductUniqueViolation(err) {
			return nil, ErrProductConflict
		}

		return nil, fmt.Errorf("commit create product: %w", err)
	}

	return r.GetByID(ctx, productID)
}

func (r *ProductRepository) Update(
	ctx context.Context,
	id int64,
	input domain.UpdateProductInput,
) (*domain.Product, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin update product: %w", err)
	}
	defer tx.Rollback(ctx)

	result, err := tx.Exec(ctx, `
        UPDATE products
        SET
            category_id = $1,
            name = $2,
            slug = $3,
            description = $4,
            price = $5,
            material = $6,
            care_instruction = $7,
            status = $8,
            updated_at = NOW()
        WHERE id = $9
    `,
		input.CategoryID,
		strings.TrimSpace(input.Name),
		strings.TrimSpace(input.Slug),
		input.Description,
		input.Price,
		input.Material,
		input.CareInstruction,
		input.Status,
		id,
	)

	if err != nil {
		if isProductUniqueViolation(err) {
			return nil, ErrProductConflict
		}

		return nil, fmt.Errorf("update product: %w", err)
	}

	if result.RowsAffected() == 0 {
		return nil, ErrProductNotFound
	}

	// Remove only this product's relations.
	// Master media_assets, colors, sizes, and collections are untouched.
	_, err = tx.Exec(ctx, `
        DELETE FROM product_variants
        WHERE product_id = $1
    `, id)

	if err != nil {
		return nil, fmt.Errorf("delete old product variants: %w", err)
	}

	_, err = tx.Exec(ctx, `
        DELETE FROM product_media
        WHERE product_id = $1
    `, id)

	if err != nil {
		return nil, fmt.Errorf("delete old product media: %w", err)
	}

	_, err = tx.Exec(ctx, `
        DELETE FROM product_collections
        WHERE product_id = $1
    `, id)

	if err != nil {
		return nil, fmt.Errorf("delete old product collections: %w", err)
	}

	err = insertProductRelations(
		ctx,
		tx,
		id,
		input.Variants,
		input.Media,
		input.CollectionIDs,
	)

	if err != nil {
		if isProductUniqueViolation(err) {
			return nil, ErrProductConflict
		}

		if isProductForeignKeyViolation(err) {
			return nil, fmt.Errorf(
				"invalid product relation: %w",
				err,
			)
		}

		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		if isProductUniqueViolation(err) {
			return nil, ErrProductConflict
		}

		return nil, fmt.Errorf("commit update product: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *ProductRepository) Delete(
	ctx context.Context,
	id int64,
) error {
	result, err := r.db.Exec(ctx, `
        DELETE FROM products
        WHERE id = $1
    `, id)

	if err != nil {
		if isProductForeignKeyViolation(err) {
			return fmt.Errorf(
				"product is referenced by another record: %w",
				err,
			)
		}

		return fmt.Errorf("delete product: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrProductNotFound
	}

	return nil
}

func (r *ProductRepository) List(
	ctx context.Context,
	limit int,
	offset int,
	status string,
) ([]domain.Product, int64, error) {
	var total int64

	countQuery := `
		SELECT COUNT(*)
		FROM products
		WHERE ($1 = '' OR status = $1)
	`

	if err := r.db.QueryRow(ctx, countQuery, status).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count products: %w", err)
	}

	query := `
		SELECT
			id,
			category_id,
			name,
			slug,
			description,
			price,
			material,
			care_instruction,
			status,
			created_at,
			updated_at
		FROM products
		WHERE ($1 = '' OR status = $1)
		ORDER BY created_at DESC, id DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, status, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list products: %w", err)
	}
	defer rows.Close()

	products := make([]domain.Product, 0)

	for rows.Next() {
		var p domain.Product

		err := rows.Scan(
			&p.ID,
			&p.CategoryID,
			&p.Name,
			&p.Slug,
			&p.Description,
			&p.Price,
			&p.Material,
			&p.CareInstruction,
			&p.Status,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan product: %w", err)
		}

		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("iterate products: %w", err)
	}

	// Close product rows before querying media.
	rows.Close()

	if len(products) == 0 {
		return products, total, nil
	}

	// Collect product IDs.
	productIDs := make([]int64, 0, len(products))

	for _, p := range products {
		productIDs = append(productIDs, p.ID)
	}

	// Fetch media for all products in one query.
	mediaByProduct, err := r.getMediaForProducts(
		ctx,
		productIDs,
	)
	if err != nil {
		return nil, 0, err
	}

	// Attach media to each product.
	for i := range products {
		if media, ok := mediaByProduct[products[i].ID]; ok {
			products[i].Media = media
		}
	}

	return products, total, nil
}
func (r *ProductRepository) getMediaForProducts(
	ctx context.Context,
	productIDs []int64,
) (map[int64][]domain.ProductMedia, error) {
	query := `
        SELECT
            pm.id,
            pm.product_id,
            pm.media_id,
            pm.media_role,
            pm.sort_order,
            pm.is_primary,
            pm.alt_text,
            pm.created_at,
            ma.file_url,
            ma.media_type
        FROM product_media pm
        JOIN media_assets ma
            ON ma.id = pm.media_id
        WHERE pm.product_id = ANY($1)
        ORDER BY
            pm.product_id ASC,
            pm.sort_order ASC,
            pm.id ASC
    `

	rows, err := r.db.Query(ctx, query, productIDs)
	if err != nil {
		return nil, fmt.Errorf(
			"get media for products: %w",
			err,
		)
	}
	defer rows.Close()

	result := make(map[int64][]domain.ProductMedia)

	for rows.Next() {
		var m domain.ProductMedia

		err := rows.Scan(
			&m.ID,
			&m.ProductID,
			&m.MediaID,
			&m.MediaRole,
			&m.SortOrder,
			&m.IsPrimary,
			&m.AltText,
			&m.CreatedAt,
			&m.FileURL,
			&m.MediaType,
		)
		if err != nil {
			return nil, fmt.Errorf(
				"scan product media: %w",
				err,
			)
		}

		result[m.ProductID] = append(
			result[m.ProductID],
			m,
		)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf(
			"iterate product media: %w",
			err,
		)
	}

	return result, nil
}

// GetByID returns one product with its variants,
// media assets, and collection IDs.
func (r *ProductRepository) GetByID(
	ctx context.Context,
	id int64,
) (*domain.Product, error) {
	var p domain.Product

	query := `
		SELECT
			id,
			category_id,
			name,
			slug,
			description,
			price,
			material,
			care_instruction,
			status,
			created_at,
			updated_at
		FROM products
		WHERE id = $1
	`

	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID,
		&p.CategoryID,
		&p.Name,
		&p.Slug,
		&p.Description,
		&p.Price,
		&p.Material,
		&p.CareInstruction,
		&p.Status,
		&p.CreatedAt,
		&p.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrProductNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get product: %w", err)
	}

	variants, err := r.getVariants(ctx, id)
	if err != nil {
		return nil, err
	}
	p.Variants = variants

	media, err := r.getMedia(ctx, id)
	if err != nil {
		return nil, err
	}
	p.Media = media

	collections, err := r.getCollections(ctx, id)
	if err != nil {
		return nil, err
	}
	p.Collections = collections

	return &p, nil
}

func (r *ProductRepository) getVariants(
	ctx context.Context,
	productID int64,
) ([]domain.ProductVariant, error) {
	query := `
		SELECT
			id,
			product_id,
			color_id,
			size_id,
			sku,
			stock,
			price,
			is_active,
			created_at,
			updated_at
		FROM product_variants
		WHERE product_id = $1
		ORDER BY id ASC
	`

	rows, err := r.db.Query(ctx, query, productID)
	if err != nil {
		return nil, fmt.Errorf("get product variants: %w", err)
	}
	defer rows.Close()

	variants := make([]domain.ProductVariant, 0)

	for rows.Next() {
		var v domain.ProductVariant

		if err := rows.Scan(
			&v.ID,
			&v.ProductID,
			&v.ColorID,
			&v.SizeID,
			&v.SKU,
			&v.Stock,
			&v.Price,
			&v.IsActive,
			&v.CreatedAt,
			&v.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan product variant: %w", err)
		}

		variants = append(variants, v)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate product variants: %w", err)
	}

	return variants, nil
}

func (r *ProductRepository) getMedia(
	ctx context.Context,
	productID int64,
) ([]domain.ProductMedia, error) {
	query := `
		SELECT
			pm.id,
			pm.product_id,
			pm.media_id,
			pm.media_role,
			pm.sort_order,
			pm.is_primary,
			pm.alt_text,
			pm.created_at,
			ma.file_url,
			ma.media_type
		FROM product_media pm
		JOIN media_assets ma ON ma.id = pm.media_id
		WHERE pm.product_id = $1
		ORDER BY pm.sort_order ASC, pm.id ASC
	`

	rows, err := r.db.Query(ctx, query, productID)
	if err != nil {
		return nil, fmt.Errorf("get product media: %w", err)
	}
	defer rows.Close()

	media := make([]domain.ProductMedia, 0)

	for rows.Next() {
		var m domain.ProductMedia

		if err := rows.Scan(
			&m.ID,
			&m.ProductID,
			&m.MediaID,
			&m.MediaRole,
			&m.SortOrder,
			&m.IsPrimary,
			&m.AltText,
			&m.CreatedAt,
			&m.FileURL,
			&m.MediaType,
		); err != nil {
			return nil, fmt.Errorf("scan product media: %w", err)
		}

		media = append(media, m)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate product media: %w", err)
	}

	return media, nil
}

func (r *ProductRepository) getCollections(
	ctx context.Context,
	productID int64,
) ([]int64, error) {
	query := `
		SELECT collection_id
		FROM product_collections
		WHERE product_id = $1
		ORDER BY collection_id ASC
	`

	rows, err := r.db.Query(ctx, query, productID)
	if err != nil {
		return nil, fmt.Errorf("get product collections: %w", err)
	}
	defer rows.Close()

	ids := make([]int64, 0)

	for rows.Next() {
		var id int64

		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan collection ID: %w", err)
		}

		ids = append(ids, id)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate product collections: %w", err)
	}

	return ids, nil
}
