import React, { useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import whiteboardMachine from '../state/wbMachine';
import { useWebGL } from '../hooks/useWebGL';
import { useWebRTC } from '../context/WebRTCContext';

const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, send] = useMachine(whiteboardMachine);
    const { handleMouseMove, handleMouseUp, handleMouseLeave, handleKeyDown, handleKeyUp } = useWebGL(canvasRef);
    const { onMessage } = useWebRTC();

    useEffect(() => {
        onMessage((message) => {
            console.log('Received message:', message);
            // Handle the message as needed
        });
    }, [onMessage]);

    // useEffect(() => {
    //     console.log('Whiteboard state:', state.value);
    // }, [state]);

    const handleMouseDown = (event: React.MouseEvent) => {
        send({ type: 'MOUSE_DOWN', clientX: event.clientX, clientY: event.clientY });
    };

    const handleKD = (event: KeyboardEvent) => handleKeyDown(event, state, send);
    const handleKU = (event: KeyboardEvent) => handleKeyUp(event, send);

    useEffect(() => {
        window.addEventListener('keydown', handleKD);
        window.addEventListener('keyup', handleKU);

        return () => {
            window.removeEventListener('keydown', handleKD);
            window.removeEventListener('keyup', handleKU);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={(event) => handleMouseMove(event, state, send)}
            onMouseUp={() => handleMouseUp(send)}
            onMouseLeave={() => handleMouseLeave(send)}
            style={{ cursor: state.matches('panning') ? 'grabbing' : 'crosshair' }}
        />
    );
};

export default Whiteboard;

