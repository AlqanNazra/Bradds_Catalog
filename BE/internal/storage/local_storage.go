package storage
import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)
type LocalStorage struct {
	rootDir string
	baseURL string
}
func NewLocalStorage(rootDir, baseURL string) *LocalStorage {
	return &LocalStorage{
		rootDir: rootDir,
		baseURL: strings.TrimRight(baseURL, "/"),
	}
}
func (s *LocalStorage) Save(
	file multipart.File,
	extension string,
) (string, string, error) {
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", fmt.Errorf("generate filename: %w", err)
	}
	filename := hex.EncodeToString(randomBytes) + extension
	dir := filepath.Join(s.rootDir, "media")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", "", fmt.Errorf("create storage directory: %w", err)
	}
	path := filepath.Join(dir, filename)
	dst, err := os.OpenFile(
		path,
		os.O_WRONLY|os.O_CREATE|os.O_EXCL,
		0644,
	)
	if err != nil {
		return "", "", fmt.Errorf("create file: %w", err)
	}
	_, copyErr := io.Copy(dst, file)
	closeErr := dst.Close()
	if copyErr != nil {
		_ = os.Remove(path)
		return "", "", fmt.Errorf("write file: %w", copyErr)
	}
	if closeErr != nil {
		_ = os.Remove(path)
		return "", "", fmt.Errorf("close file: %w", closeErr)
	}
	storageKey := filepath.ToSlash(
		filepath.Join("media", filename),
	)
	fileURL := s.baseURL + "/" + storageKey
	return storageKey, fileURL, nil
}

func (s *LocalStorage) Delete(storageKey string) error {
	cleanKey := filepath.Clean(filepath.FromSlash(storageKey))
	if cleanKey == "." || filepath.IsAbs(cleanKey) ||
		cleanKey == ".." ||
		strings.HasPrefix(
			cleanKey,
			".."+string(os.PathSeparator),
		) {
		return fmt.Errorf("invalid storage key")
	}
	path := filepath.Join(s.rootDir, cleanKey)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("delete file: %w", err)
	}
	return nil
}