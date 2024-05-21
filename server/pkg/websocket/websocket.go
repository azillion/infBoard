package websocket

import (
	"encoding/json"
	"log"
	"net/http"

	"infboard/pkg/models"
	"infboard/pkg/peerconnection"
	"infboard/pkg/storage"
	"infboard/pkg/utils"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

const (
	socketEventCandidate = "candidate"
	socketEventAnswer    = "answer"
	socketEventPanning   = "panning"
	socketEventDrawing   = "drawing"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		url := r.Header.Get("Origin")
		switch url {
		case "http://localhost:5173":
			return true
		case "https://infboard.com":
			return true
		default:
			return false
		}
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

	session := peerconnection.CreateSession(userID, peerConnection, dataChannel, c)
	defer peerconnection.DeleteSession(userID)

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
			Event: socketEventCandidate,
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
		case socketEventCandidate:
			candidate := webrtc.ICECandidateInit{}
			if err := json.Unmarshal([]byte(message.Data), &candidate); err != nil {
				log.Println(err)
				return
			}

			if err := peerConnection.AddICECandidate(candidate); err != nil {
				log.Println(err)
				return
			}
		case socketEventAnswer:
			answer := webrtc.SessionDescription{}
			if err := json.Unmarshal([]byte(message.Data), &answer); err != nil {
				log.Println(err)
				return
			}

			if err := peerConnection.SetRemoteDescription(answer); err != nil {
				log.Println(err)
				return
			}
		case socketEventPanning:
			panning := models.PanningOffset{}
			if err := json.Unmarshal([]byte(message.Data), &panning); err != nil {
				log.Println(err)
				return
			}
			session.Panning = panning
			peerconnection.UpdateSession(userID, session)
		case socketEventDrawing:
			point := models.DrawingPointWithOffset{}
			if err := json.Unmarshal([]byte(message.Data), &point); err != nil {
				log.Println(err)
				return
			}
			session.Panning = models.PanningOffset{X: point.OffsetX, Y: point.OffsetY}
			peerconnection.UpdateSession(userID, session)
			storage.SaveDrawingPoint(userID, point)
			peerconnection.BroadcastDrawingPoint(userID, point)
		}
	}
}
