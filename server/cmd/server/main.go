package main

import (
	"flag"
	"log"
	"net/http"

	"infboard/pkg/signaling"
)

var (
	addr = flag.String("addr", ":8080", "http service address")
)

func main() {
	flag.Parse()
	log.SetFlags(0)

	http.HandleFunc("/websocket", signaling.WebsocketHandler)
	http.Handle("/", http.FileServer(http.Dir("./static")))

	log.Fatal(http.ListenAndServe(*addr, nil))
}

