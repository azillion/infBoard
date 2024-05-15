import React, { useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import whiteboardMachine from '../state/wbMachine';
import { useWebRTC } from '../context/WebRTCContext';

const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, send] = useMachine(whiteboardMachine);
    const { offset } = state.context;
    const { sendMessage } = useWebRTC();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            drawScene();
        };

        const drawScene = () => {
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [offset]);

    const handleMouseDown = (event: React.MouseEvent) => {
        send({ type: 'MOUSE_DOWN', clientX: event.clientX, clientY: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        if (state.matches('panning')) {
            send({ type: 'MOUSE_MOVE', clientX: event.clientX, clientY: event.clientY });
            sendMessage(`Mouse moved to (${event.clientX}, ${event.clientY})`);
        }
    };

    const handleMouseUp = () => {
        send({ type: 'MOUSE_UP' });
    };

    const handleMouseLeave = () => {
        send({ type: 'MOUSE_LEAVE' });
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: state.matches('panning') ? 'grabbing' : 'grab' }}
        />
    );
};

export default Whiteboard;

