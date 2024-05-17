package encoder

import (
	"bytes"
	"encoding/binary"
	"testing"
)

func TestCanvasEncoder_Encode(t *testing.T) {
	encoder := &CanvasEncoder{}
	message := "Hello, World!"
	expected := "/canvas:Hello, World!"

	encoded, err := encoder.Encode(message)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if encoded != expected {
		t.Fatalf("Expected %v, got %v", expected, encoded)
	}
}

func TestCanvasEncoder_EncodeWithLengthPrefix(t *testing.T) {
	encoder := &CanvasEncoder{}
	message := "Hello, World!"
	expectedMessage := "/canvas:Hello, World!"
	expectedLength := int32(len(expectedMessage))

	encoded, err := encoder.EncodeWithLengthPrefix(message)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	buf := bytes.NewReader(encoded)

	var length int32
	if err := binary.Read(buf, binary.BigEndian, &length); err != nil {
		t.Fatalf("Failed to read length prefix: %v", err)
	}

	if length != expectedLength {
		t.Fatalf("Expected length %v, got %v", expectedLength, length)
	}

	encodedMessage := make([]byte, length)
	if _, err := buf.Read(encodedMessage); err != nil {
		t.Fatalf("Failed to read message: %v", err)
	}

	if string(encodedMessage) != expectedMessage {
		t.Fatalf("Expected message %v, got %v", expectedMessage, string(encodedMessage))
	}
}
