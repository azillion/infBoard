import React, { useRef } from 'react';
import { useWebGL } from '../hooks/useWebGL';
import { useMachine } from '@xstate/react';
import whiteboardMachine from '../state/wbMachine';

const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [state, _send] = useMachine(whiteboardMachine);
    const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } = useWebGL(canvasRef);

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: state.matches('panning') ? 'grabbing' : 'crosshair' }}
        />
    );
};

export default Whiteboard;

