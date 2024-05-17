package encoder

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

const canvasPrefix = "/canvas:"

// CanvasEncoder is an implementation of Encoder that prefixes messages with "/canvas:".
type CanvasEncoder struct{}

// Encode prefixes the given message with "/canvas:".
func (e *CanvasEncoder) Encode(message string) (string, error) {
	prefixedMessage := fmt.Sprintf("%s%s", canvasPrefix, message)
	return prefixedMessage, nil
}

// EncodeWithLengthPrefix prefixes the given message with "/canvas:"
// and adds a length prefix to the message.
func (e *CanvasEncoder) EncodeWithLengthPrefix(message string) ([]byte, error) {
	prefixedMessage := fmt.Sprintf("%s%s", canvasPrefix, message)
	length := int32(len(prefixedMessage))

	// Create a buffer to hold the length prefix and the message
	buf := new(bytes.Buffer)

	// Write the length prefix as a 4-byte integer
	if err := binary.Write(buf, binary.BigEndian, length); err != nil {
		return nil, err
	}

	if _, err := buf.WriteString(prefixedMessage); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}
