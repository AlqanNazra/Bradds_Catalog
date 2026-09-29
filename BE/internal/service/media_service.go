package service

import (
	"context"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	_ "golang.org/x/image/webp"
	"net/http"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/AlqanNazra/Bradds_Catalog.git/internal/model"
)

const maxImageSize = 5 << 20 // 5 MB

var (
	ErrInvalidMedia = errors.New("invalid media file")
	ErrMediaTooLarge = errors.New("media file too large")
)

type MediaRepository interface {
	Create(
		ctx context.Context,
		input domain.CreateMediaInput,
	) (*domain.MediaAsset, error)
}

type MediaStorage interface {
	Save(
		file multipart.File,
		extension string,
	) (string, string, error)

	Delete(storageKey string) error
}

type MediaService struct {
	repo    MediaRepository
	storage MediaStorage
}

func NewMediaService(
	repo MediaRepository,
	storage MediaStorage,
) *MediaService {
	return &MediaService{
		repo:    repo,
		storage: storage,
	}
}

func (s *MediaService) Upload(
	ctx context.Context,
	header *multipart.FileHeader,
) (*domain.MediaAsset, error) {
	if header == nil {
		return nil, ErrInvalidMedia
	}

	if header.Size <= 0 {
		return nil, ErrInvalidMedia
	}

	if header.Size > maxImageSize {
		return nil, ErrMediaTooLarge
	}

	file, err := header.Open()
	if err != nil {
		return nil, fmt.Errorf("open uploaded file: %w", err)
	}
	defer file.Close()

	// Read the actual file signature, not only the client MIME.
	buffer := make([]byte, 512)

	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("read uploaded file: %w", err)
	}

	if n == 0 {
		return nil, ErrInvalidMedia
	}

	contentType := strings.ToLower(
		strings.TrimSpace(
			strings.Split(
				http.DetectContentType(buffer[:n]),
				";",
			)[0],
		),
	)

	extensions := map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
	}

	extension, ok := extensions[contentType]
	if !ok {
		return nil, ErrInvalidMedia
	}

	// Decode the image to verify that the file is a valid image.
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("reset file reader: %w", err)
	}

	config, _, err := image.DecodeConfig(file)
	if err != nil {
		return nil, ErrInvalidMedia
	}

	if config.Width <= 0 || config.Height <= 0 {
		return nil, ErrInvalidMedia
	}

	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, fmt.Errorf("reset file reader: %w", err)
	}

	storageKey, fileURL, err := s.storage.Save(
		file,
		extension,
	)
	if err != nil {
		return nil, err
	}

	originalFilename := filepath.Base(header.Filename)

	if len(originalFilename) > 255 {
		originalFilename = originalFilename[:255]
	}

	input := domain.CreateMediaInput{
		FileURL:          fileURL,
		StorageProvider:  "local",
		StorageKey:       &storageKey,
		MediaType:        "image",
		MimeType:         contentType,
		OriginalFilename: originalFilename,
		FileSizeBytes:    header.Size,
		Width:            &config.Width,
		Height:           &config.Height,
		Status:            "ready",
	}

	media, err := s.repo.Create(ctx, input)
	if err != nil {
		// Roll back the physical file if DB insertion fails.
		_ = s.storage.Delete(storageKey)
		return nil, fmt.Errorf("save media metadata: %w", err)
	}

	return media, nil
}