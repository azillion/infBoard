package storage

import (
	"sync"

	"infboard/pkg/models"
)

var (
	drawingPoints = sync.Map{}
)

func SaveDrawingPoint(userID string, point models.DrawingPointWithOffset) {
	points, _ := drawingPoints.LoadOrStore(userID, []models.DrawingPointWithOffset{})
	drawingPoints.Store(userID, append(points.([]models.DrawingPointWithOffset), point))
}

func GetDrawingPoints() []models.DrawingPointWithOffset {
	points := []models.DrawingPointWithOffset{}
	drawingPoints.Range(func(key, value interface{}) bool {
		points = append(points, value.([]models.DrawingPointWithOffset)...)
		return true
	})
	return points
}
