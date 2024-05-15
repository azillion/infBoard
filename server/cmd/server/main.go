// main.go
package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
)

var (
	addr     = flag.String("addr", ":8080", "http service address")
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	listLock        sync.RWMutex
	peerConnections []peerConnectionState
)

type websocketMessage struct {
	Event string `json:"event"`
	Data  string `json:"data"`
}

type peerConnectionState struct {
	peerConnection *webrtc.PeerConnection
	websocket      *threadSafeWriter
}

func main() {
	flag.Parse()
	log.SetFlags(0)

	http.HandleFunc("/websocket", websocketHandler)
	http.Handle("/", http.FileServer(http.Dir("./static")))

	log.Fatal(http.ListenAndServe(*addr, nil))
}

func websocketHandler(w http.ResponseWriter, r *http.Request) {
	unsafeConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	c := &threadSafeWriter{unsafeConn, sync.Mutex{}}
	defer c.Close()

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

	dataChannel.OnOpen(func() {
		log.Println("Data channel opened!")
		for i := 0; i < 5; i++ {
			message := "Message " + string(i) + " from Pion"
			if err := dataChannel.SendText(message); err != nil {
				log.Print(err)
				return
			}
		}
	})

	dataChannel.OnMessage(func(msg webrtc.DataChannelMessage) {
		log.Printf("Message from DataChannel: %s\n", string(msg.Data))
	})

	listLock.Lock()
	peerConnections = append(peerConnections, peerConnectionState{peerConnection, c})
	listLock.Unlock()

	peerConnection.OnICECandidate(func(i *webrtc.ICECandidate) {
		if i == nil {
			return
		}

		candidateString, err := json.Marshal(i.ToJSON())
		if err != nil {
			log.Println(err)
			return
		}

		if err := c.WriteJSON(&websocketMessage{
			Event: "candidate",
			Data:  string(candidateString),
		}); err != nil {
			log.Println(err)
		}
	})

	signalPeerConnections()

	message := &websocketMessage{}
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

type threadSafeWriter struct {
	*websocket.Conn
	sync.Mutex
}

func (t *threadSafeWriter) WriteJSON(v interface{}) error {
	t.Lock()
	defer t.Unlock()
	return t.Conn.WriteJSON(v)
}

func signalPeerConnections() {
	listLock.Lock()
	defer listLock.Unlock()

	for i := 0; i < len(peerConnections); i++ {
		if peerConnections[i].peerConnection.ConnectionState() == webrtc.PeerConnectionStateClosed {
			peerConnections = append(peerConnections[:i], peerConnections[i+1:]...)
			i-- // Adjust index to account for removed element
			continue
		}

		offer, err := peerConnections[i].peerConnection.CreateOffer(nil)
		if err != nil {
			log.Println(err)
			continue
		}

		if err = peerConnections[i].peerConnection.SetLocalDescription(offer); err != nil {
			log.Println(err)
			continue
		}

		offerString, err := json.Marshal(offer)
		if err != nil {
			log.Println(err)
			continue
		}

		if err = peerConnections[i].websocket.WriteJSON(&websocketMessage{
			Event: "offer",
			Data:  string(offerString),
		}); err != nil {
			log.Println(err)
		}
	}
}

