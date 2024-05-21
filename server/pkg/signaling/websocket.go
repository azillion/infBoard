package signaling

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
	"infboard/pkg/peerconnection"
	"infboard/pkg/utils"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// Check if the origin is in the list of allowed origins
		allowedOrigins := map[string]bool{
			"http://localhost:5173": true,
			"https://infboard.com":  true,
		}
		return allowedOrigins[origin]
	},
}

func WebsocketHandler(w http.ResponseWriter, r *http.Request) {
	unsafeConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	c := &utils.ThreadSafeWriter{Conn: unsafeConn}
	defer c.Close()

	userID := utils.GenerateUniqueID()
	log.Printf("New user connected: %s", userID)

	peerConnection, err := webrtc.NewPeerConnection(webrtc.Configuration{})
	if err != nil {
		log.Print(err)
		return
	}
	defer peerConnection.Close()

	dataChannel, err := peerConnection.CreateDataChannel("data", nil)
	if err != nil {
		log.Print(err)
		return
	}

	peerconnection.RegisterDataChannelCallbacks(dataChannel)
	peerconnection.AddPeerConnection(peerConnection, c)

	peerConnection.OnICECandidate(func(i *webrtc.ICECandidate) {
		if i == nil {
			return
		}

		candidateString, err := json.Marshal(i.ToJSON())
		if err != nil {
			log.Println(err)
			return
		}

		if err := c.WriteJSON(&utils.WebsocketMessage{
			Event: "candidate",
			Data:  string(candidateString),
		}); err != nil {
			log.Println(err)
		}
	})

	peerconnection.SignalPeerConnections()

	message := &utils.WebsocketMessage{}
	for {
		_, raw, err := c.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		} else if err := json.Unmarshal(raw, &message); err != nil {
			log.Println(err)
			return
		}

		switch message.Event {
		case "candidate":
			candidate := webrtc.ICECandidateInit{}
			if err := json.Unmarshal([]byte(message.Data), &candidate); err != nil {
				log.Println(err)
				return
			}

			if err := peerConnection.AddICECandidate(candidate); err != nil {
				log.Println(err)
				return
			}
		case "answer":
			answer := webrtc.SessionDescription{}
			if err := json.Unmarshal([]byte(message.Data), &answer); err != nil {
				log.Println(err)
				return
			}

			if err := peerConnection.SetRemoteDescription(answer); err != nil {
				log.Println(err)
				return
			}
		}
	}
}
