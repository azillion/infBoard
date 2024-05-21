import React, { useRef } from 'react';
import { useWebGL } from '../hooks/useWebGL';

const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } = useWebGL(canvasRef);

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onTouchCancel={handleMouseLeave}
            style={{ cursor: 'crosshair' }}
        />
    );
};

export default Whiteboard;

