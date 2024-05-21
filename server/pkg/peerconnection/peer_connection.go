package peerconnection

import (
	"encoding/json"
	"log"
	"sync"

	"github.com/pion/webrtc/v3"
	"infboard/pkg/models"
	"infboard/pkg/utils"
)

var (
	listLock        sync.RWMutex
	peerConnections []models.PeerConnectionState
)

func RegisterDataChannelCallbacks(dataChannel *webrtc.DataChannel) {
	dataChannel.OnOpen(func() {
		log.Println("DataChannel opened")
		// send canvas and cursor data
	})

	dataChannel.OnMessage(func(msg webrtc.DataChannelMessage) {
		log.Printf("Message from DataChannel: %s\n", string(msg.Data))
	})
}

func SignalPeerConnections() {
	listLock.Lock()
	defer listLock.Unlock()

	for i := 0; i < len(peerConnections); i++ {
		if peerConnections[i].PeerConnection.ConnectionState() == webrtc.PeerConnectionStateClosed {
			peerConnections = append(peerConnections[:i], peerConnections[i+1:]...)
			i-- // Adjust index to account for removed element
			continue
		}

		offer, err := peerConnections[i].PeerConnection.CreateOffer(nil)
		if err != nil {
			log.Println(err)
			continue
		}

		if err = peerConnections[i].PeerConnection.SetLocalDescription(offer); err != nil {
			log.Println(err)
			continue
		}

		offerString, err := json.Marshal(offer)
		if err != nil {
			log.Println(err)
			continue
		}

		if err = peerConnections[i].Websocket.WriteJSON(&utils.WebsocketMessage{
			Event: "offer",
			Data:  string(offerString),
		}); err != nil {
			log.Println(err)
		}
	}
}

func AddPeerConnection(pc *webrtc.PeerConnection, ws *utils.ThreadSafeWriter) {
	listLock.Lock()
	defer listLock.Unlock()
	peerConnections = append(peerConnections, models.PeerConnectionState{PeerConnection: pc, Websocket: ws})
}
