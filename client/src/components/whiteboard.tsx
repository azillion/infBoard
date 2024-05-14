import React, { useRef, useEffect, useState } from 'react';

const Whiteboard: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

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
        setIsPanning(true);
        setStartPos({ x: event.clientX - offset.x, y: event.clientY - offset.y });
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        if (isPanning) {
            setOffset({ x: event.clientX - startPos.x, y: event.clientY - startPos.y });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        />
    );
};

export default Whiteboard;
