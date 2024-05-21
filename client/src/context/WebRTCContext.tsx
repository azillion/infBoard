import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppContext } from './AppContext';
import { EventType } from '../models/event';

interface WebRTCContextType {
    sendMessage: (event: EventType, message: string) => void;
    onMessage: (callback: (message: string) => void) => void;
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export const useWebRTC = () => {
    const context = useContext(WebRTCContext);
    if (!context) {
        throw new Error('useWebRTC must be used within a WebRTCProvider');
    }
    return context;
};

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const messageCallbackRef = useRef<(message: string) => void>(() => { });
    const appContextRef = AppContext.useActorRef();
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!pcRef.current) {
            console.log('Creating RTCPeerConnection');
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            pcRef.current = pc;

            if (!wsRef.current) {
                console.log('Creating WebSocket connection');
                const ws = new WebSocket('ws://localhost:8080/websocket');
                wsRef.current = ws;

                ws.onmessage = async (event) => {
                    const message = JSON.parse(event.data);
                    switch (message.event) {
                        case EventType.OFFER:
                            if (pcRef.current) {
                                await pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.data)));
                                const answer = await pcRef.current.createAnswer();
                                await pcRef.current.setLocalDescription(answer);
                                ws.send(JSON.stringify({ event: 'answer', data: JSON.stringify(answer) }));
                            }
                            break;
                        case EventType.CANDIDATE:
                            if (pcRef.current) {
                                await pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data)));
                            }
                            break;
                        default:
                            console.error('Unknown message event:', message.event);
                    }
                };

                ws.onclose = () => {
                    wsRef.current = null;
                };
            }

            pc.onicecandidate = (event) => {
                if (event.candidate && wsRef.current) {
                    wsRef.current.send(JSON.stringify({ event: 'candidate', data: JSON.stringify(event.candidate) }));
                }
            };

            pc.ondatachannel = (event) => {
                const channel = event.channel;
                setDataChannel(channel);
                channel.onmessage = (e) => {
                    if (messageCallbackRef.current) {
                        messageCallbackRef.current(e.data);
                    }
                };
                channel.onopen = () => {
                    console.log('Data channel opened!');
                    appContextRef.send({ type: 'CONNECTION_ESTABLISHED' });
                };
            };
        }
    }, [appContextRef]);

    useEffect(() => {
        if (dataChannel) {
            dataChannel.onmessage = (e) => {
                if (messageCallbackRef.current) {
                    messageCallbackRef.current(e.data);
                }
            };
        }
    }, [dataChannel]);

    // const sendMessage = useCallback((message: string) => {
    //     if (dataChannel && dataChannel.readyState === 'open') {
    //         dataChannel.send(message);
    //     } else {
    //         console.error('Data channel is not open', dataChannel?.readyState);
    //     }
    // }, [dataChannel]);

    const sendMessage = useCallback((event: EventType, message: string) => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({ event, data: message }));
        }
    }, []);


    const onMessage = useCallback((callback: (message: string) => void) => {
        messageCallbackRef.current = callback;
    }, []);

    return (
        <WebRTCContext.Provider value={{ sendMessage, onMessage }}>
            {children}
        </WebRTCContext.Provider>
    );
};

















