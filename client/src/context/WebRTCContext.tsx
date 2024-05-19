import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppContext } from './AppContext';

interface WebRTCContextType {
    sendMessage: (message: string) => void;
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
    const [messageCallback, setMessageCallback] = useState<(message: string) => void>(() => { });
    const appContextRef = AppContext.useActorRef();
    const state = AppContext.useSelector((state) => state)

    useEffect(() => {
        console.log('App state2:', state.value);
    }, [state]);

    useEffect(() => {
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        const ws = new WebSocket('ws://localhost:8080/websocket');

        ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            switch (message.event) {
                case 'offer':
                    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.data)));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    ws.send(JSON.stringify({ event: 'answer', data: JSON.stringify(answer) }));
                    break;
                case 'candidate':
                    await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(message.data)));
                    break;
            }
        };

        pc.onicecandidate = event => {
            if (event.candidate) {
                ws.send(JSON.stringify({ event: 'candidate', data: JSON.stringify(event.candidate) }));
            }
        };

        pc.ondatachannel = event => {
            const channel = event.channel;
            setDataChannel(channel);
            channel.onmessage = e => {
                if (messageCallback) {
                    messageCallback(e.data);
                }
            };
            channel.onopen = () => {
                console.log('Data channel opened!');
                appContextRef.send({ type: 'CONNECTION_ESTABLISHED' });
            };
        };

        return () => {
            ws.close();
            pc.close();
        };
    }, [messageCallback, appContextRef.send]);

    const sendMessage = (message: string) => {
        if (dataChannel && dataChannel.readyState === 'open') {
            dataChannel.send(message);
        } else {
            console.error('Data channel is not open', message);
        }
    };

    const onMessage = (callback: (message: string) => void) => {
        setMessageCallback(() => callback);
    };

    return (
        <WebRTCContext.Provider value={{ sendMessage, onMessage }}>
            {children}
        </WebRTCContext.Provider>
    );
};

