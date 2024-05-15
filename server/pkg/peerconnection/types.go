package peerconnection

import (
	"github.com/pion/webrtc/v3"
	"infboard/pkg/utils"
)

type PeerConnectionState struct {
	PeerConnection *webrtc.PeerConnection
	Websocket      *utils.ThreadSafeWriter
}
