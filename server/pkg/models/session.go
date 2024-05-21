package models

import (
	"github.com/pion/webrtc/v3"

	"infboard/pkg/utils"
)

type Session struct {
	UserID           string
	PeerConnection   *webrtc.PeerConnection
	DataChannel      *webrtc.DataChannel
	ThreadSafeWriter *utils.ThreadSafeWriter
	Drawings         []DrawingPoint
	Panning          PanningOffset
}
