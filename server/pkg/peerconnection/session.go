package peerconnection

import (
	"log"
	"sync"

	"github.com/pion/webrtc/v3"

	"infboard/pkg/models"
	"infboard/pkg/utils"
)

type UserSession struct {
	Drawings []models.DrawingPoint `json:"drawings"`
	Panning  models.PanningOffset  `json:"panning"`
}

var sessions sync.Map

func CreateSession(userID string, pc *webrtc.PeerConnection, dc *webrtc.DataChannel, writer *utils.ThreadSafeWriter) *models.Session {
	session := &models.Session{
		UserID:           userID,
		PeerConnection:   pc,
		DataChannel:      dc,
		ThreadSafeWriter: writer,
		Drawings:         []models.DrawingPoint{},
		Panning:          models.PanningOffset{},
	}
	sessions.Store(userID, session)
	return session
}

func GetSession(userID string) (*models.Session, bool) {
	session, ok := sessions.Load(userID)
	if !ok {
		return nil, false
	}
	return session.(*models.Session), true
}

func UpdateSession(userID string, session *models.Session) {
	sessions.Store(userID, session)
}

func DeleteSession(userID string) {
	log.Printf("Deleting session for user %s", userID)
	sessions.Delete(userID)
}

func UpdateDrawing(userID string, point models.DrawingPoint) {
	session, _ := sessions.LoadOrStore(userID, &UserSession{})
	userSession := session.(*UserSession)
	userSession.Drawings = append(userSession.Drawings, point)
	sessions.Store(userID, userSession)
}

func UpdatePanning(userID string, offset models.PanningOffset) {
	session, _ := sessions.LoadOrStore(userID, &UserSession{})
	userSession := session.(*UserSession)
	userSession.Panning = offset
	sessions.Store(userID, userSession)
}
