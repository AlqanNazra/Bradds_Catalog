package domain
import "time"
type Color struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	HexCode   string    `json:"hex_code"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateColorInput struct {
	Name    string `json:"name" binding:"required"`
	HexCode string `json:"hex_code"`
}

type UpdateColorInput struct {
	Name    string `json:"name" binding:"required"`
	HexCode string `json:"hex_code"`
}