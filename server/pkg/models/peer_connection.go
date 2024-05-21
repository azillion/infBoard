package models

import (
	"github.com/pion/webrtc/v3"
	"infboard/pkg/utils"
)

type WebsocketMessage struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}

type DataChannelMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type PeerConnectionState struct {
	PeerConnection *webrtc.PeerConnection
	Websocket      *utils.ThreadSafeWriter
}
