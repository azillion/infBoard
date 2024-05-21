package peerconnection

import (
	"encoding/json"
	"log"
	"sync"

	"infboard/pkg/models"
	"infboard/pkg/storage"
	"infboard/pkg/utils"

	"github.com/pion/webrtc/v3"
)

var (
	listLock        sync.RWMutex
	peerConnections []models.PeerConnectionState
)

func RegisterDataChannelCallbacks(dataChannel *webrtc.DataChannel) {
	dataChannel.OnOpen(func() {
		log.Println("DataChannel opened")
		points := storage.GetDrawingPoints()
		for _, point := range points {
			message := models.DataChannelMessage{
				Type: "drawing",
				Data: point,
			}
			messageBytes, err := json.Marshal(message)
			if err != nil {
				log.Println(err)
				return
			}
			if err := dataChannel.Send(messageBytes); err != nil {
				log.Println(err)
				return
			}
		}
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

func BroadcastDrawingPoint(senderID string, point models.DrawingPointWithOffset) {
	listLock.RLock()
	defer listLock.RUnlock()

	message := models.DataChannelMessage{
		Type: "drawing",
		Data: point,
	}
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Println(err)
		return
	}

	sessions.Range(func(key, value interface{}) bool {
		session := value.(*models.Session)
		if session.UserID != senderID {
			if session.DataChannel.ReadyState() == webrtc.DataChannelStateOpen {
				if err := session.DataChannel.Send(messageBytes); err != nil {
					log.Println(err)
				}
			}
		}
		return true
	})
}
