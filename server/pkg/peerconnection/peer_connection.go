package peerconnection

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/pion/webrtc/v3"
	"infboard/pkg/utils"
)

var (
	listLock        sync.RWMutex
	peerConnections []PeerConnectionState
)

func RegisterDataChannelCallbacks(dataChannel *webrtc.DataChannel) {
	dataChannel.OnOpen(func() {
		log.Println("Data channel opened!")
		for i := 0; i < 5; i++ {
			message := "Message " + fmt.Sprint(i) + " from Pion"
			if err := dataChannel.SendText(message); err != nil {
				log.Print(err)
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
	peerConnections = append(peerConnections, PeerConnectionState{PeerConnection: pc, Websocket: ws})
}
