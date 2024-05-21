package models

type DrawingPoint struct {
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
	PanX float64 `json:"panX"`
	PanY float64 `json:"panY"`
}

type PanningOffset struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}
