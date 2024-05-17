package encoder

type Encoder interface {
	Encode(message string) (string, error)
	EncodeWithLengthPrefix(message string) ([]byte, error)
}

var DefaultEncoder Encoder = &CanvasEncoder{}

func SetDefaultEncoder(encoder Encoder) {
	DefaultEncoder = encoder
}
