package storage

import (
	"sync"
	"testing"

	"infboard/pkg/models"
)

func TestSaveDrawingPoint(t *testing.T) {
	// Reset the drawingPoints map for a clean test environment
	drawingPoints = sync.Map{}

	userID := "user1"
	point := models.DrawingPointWithOffset{
		X:       10,
		Y:       20,
		OffsetX: 30,
		OffsetY: 40,
	}

	SaveDrawingPoint(userID, point)

	// Verify the point was saved
	points, _ := drawingPoints.Load(userID)
	savedPoints := points.([]models.DrawingPointWithOffset)

	if len(savedPoints) != 1 {
		t.Errorf("expected 1 point, got %d", len(savedPoints))
	}

	if savedPoints[0] != point {
		t.Errorf("expected point %+v, got %+v", point, savedPoints[0])
	}
}

func TestGetDrawingPoints(t *testing.T) {
	// Reset the drawingPoints map for a clean test environment
	drawingPoints = sync.Map{}

	userID1 := "user1"
	point1 := models.DrawingPointWithOffset{
		X:       10,
		Y:       20,
		OffsetX: 30,
		OffsetY: 40,
	}
	SaveDrawingPoint(userID1, point1)

	userID2 := "user2"
	point2 := models.DrawingPointWithOffset{
		X:       50,
		Y:       60,
		OffsetX: 70,
		OffsetY: 80,
	}
	SaveDrawingPoint(userID2, point2)

	allPoints := GetDrawingPoints()

	if len(allPoints) != 2 {
		t.Errorf("expected 2 points, got %d", len(allPoints))
	}

	expectedPoints := []models.DrawingPointWithOffset{point1, point2}
	for i, point := range expectedPoints {
		if allPoints[i] != point {
			t.Errorf("expected point %+v, got %+v", point, allPoints[i])
		}
	}
}
