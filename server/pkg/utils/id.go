package utils

import (
	"github.com/google/uuid"
)

// GenerateUniqueID generates a unique ID for each user session.
func GenerateUniqueID() string {
	return uuid.New().String()
}
