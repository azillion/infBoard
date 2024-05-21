package models

type DrawingPoint struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type DrawingPointWithOffset struct {
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
	OffsetX float64 `json:"offsetX"`
	OffsetY float64 `json:"offsetY"`
}

type PanningOffset struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}
