import { useEffect, useRef, useCallback } from 'react';
import { encode } from '../utils/encoder';
import { useWebRTC } from '../context/WebRTCContext';
import { MessageType } from '../models/message';

export const useWebGL = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const { sendMessage, onMessage } = useWebRTC();
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const vertexPositionRef = useRef<number | null>(null);
    const positionBufferRef = useRef<WebGLBuffer | null>(null);
    const positionsRef = useRef<number[]>([]);
    const needsUpdateRef = useRef<boolean>(false);
    const lastMouseXRef = useRef<number | null>(null);
    const lastMouseYRef = useRef<number | null>(null);
    const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const startPanOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const addPoint = useCallback((x: number, y: number) => {
        positionsRef.current.push(x, y);
        needsUpdateRef.current = true;
    }, []);

    const interpolatePoints = useCallback((x0: number, y0: number, x1: number, y1: number) => {
        const distance = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
        const steps = Math.ceil(distance / 0.01); // Adjust the step size as needed
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x0 + t * (x1 - x0);
            const y = y0 + t * (y1 - y0);
            addPoint(x, y);
        }
    }, [addPoint]);

    const drawScene = useCallback(() => {
        const gl = glRef.current;
        const program = programRef.current;
        if (!gl || !program || !needsUpdateRef.current) return;

        gl.clear(gl.COLOR_BUFFER_BIT);

        const panOffset = panOffsetRef.current;
        const panOffsetLocation = gl.getUniformLocation(program, 'uPanOffset');
        if (panOffsetLocation) {
            gl.uniform2f(panOffsetLocation, panOffset.x, panOffset.y);
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionsRef.current), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(vertexPositionRef.current!, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, positionsRef.current.length / 2);
        needsUpdateRef.current = false;
    }, []);

    const animate = useCallback(() => {
        drawScene();
        requestAnimationFrame(animate);
    }, [drawScene]);

    const setupWebGL = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let gl = canvas.getContext('webgl');
        if (!gl) {
            alert('Your browser does not support WebGL');
            return;
        }

        glRef.current = gl;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        };

        resizeCanvas();

        const vertexShaderSource = `
            attribute vec4 aVertexPosition;
            uniform vec2 uPanOffset;
            void main(void) {
                gl_Position = vec4(aVertexPosition.xy + uPanOffset, 0.0, 1.0);
                gl_PointSize = 5.0;
            }
        `;

        const fragmentShaderSource = `
            void main(void) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            }
        `;

        const loadShader = (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        };

        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

        const shaderProgram = gl.createProgram();
        if (!shaderProgram || !vertexShader || !fragmentShader) return;
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return;
        }

        gl.useProgram(shaderProgram);
        programRef.current = shaderProgram;

        vertexPositionRef.current = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
        gl.enableVertexAttribArray(vertexPositionRef.current);

        positionBufferRef.current = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);

        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        window.addEventListener('resize', resizeCanvas);
        animate();
    }, [animate, canvasRef]);

    useEffect(() => {
        setupWebGL();
    }, [setupWebGL]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            const gl = glRef.current;
            if (!gl) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
            drawScene();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [drawScene]);

    useEffect(() => {
        onMessage((message: string) => {
            const decodedMessage = JSON.parse(message);
            if (decodedMessage.type === MessageType.DRAWING) {
                const { x, y, panX, panY } = decodedMessage.data;
                const { x: adjustedX, y: adjustedY } = adjustForPan(x, y, panX, panY);
                addPoint(adjustedX, adjustedY);
            } else if (decodedMessage.type === MessageType.PANNING) {
                const { x, y } = decodedMessage.data;
                panOffsetRef.current.x += x;
                panOffsetRef.current.y += y;
                needsUpdateRef.current = true;
            }
        });
    }, [onMessage, addPoint]);

    const getWebGLCoordinates = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width * 2 - 1;
        const y = -((clientY - rect.top) / rect.height * 2 - 1); // Flip Y-axis for WebGL coordinates
        return { x, y };
    };

    const getCanvasCoordinates = (canvas: HTMLCanvasElement, x: number, y: number) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = ((x + 1) / 2) * rect.width + rect.left;
        const clientY = rect.bottom - ((y + 1) / 2) * rect.height;
        return { clientX, clientY };
    };

    const adjustForPan = (x: number, y: number, panX: number, panY: number) => {
        return {
            x: x - panX,
            y: y - panY
        };
    };

    const handleKeyDown = useCallback((event: KeyboardEvent, state: any, send: any) => {
        if (event.key === ' ' && state.matches('idle')) {
            send({ type: 'KEY_DOWN', key: event.key });
            startPanOffsetRef.current = { ...panOffsetRef.current };
            event.preventDefault(); // Prevent the default action of the space bar
        }
    }, []);

    const handleKeyUp = useCallback((event: KeyboardEvent, send: any) => {
        send({ type: 'KEY_UP', key: event.key });
        event.preventDefault();
    }, []);

    const handleMouseDown = (event: React.MouseEvent, send: any) => {
        lastMouseXRef.current = event.clientX;
        lastMouseYRef.current = event.clientY;
        send({ type: 'MOUSE_DOWN', clientX: event.clientX, clientY: event.clientY });
    };

    const handleMouseMove = (event: React.MouseEvent, state: any, send: any) => {
        const canvas = canvasRef.current!;
        const { x, y } = getWebGLCoordinates(canvas, event.clientX, event.clientY);
        const panX = panOffsetRef.current.x;
        const panY = panOffsetRef.current.y;

        if (state.matches('drawing')) {
            if (lastMouseXRef.current !== null && lastMouseYRef.current !== null) {
                interpolatePoints(lastMouseXRef.current, lastMouseYRef.current, x, y);
            } else {
                addPoint(x, y);
            }

            const { clientX, clientY } = getCanvasCoordinates(canvas, x, y);
            sendMessage(encode(MessageType.DRAWING, { x: clientX, y: clientY, panX, panY }));

            lastMouseXRef.current = x;
            lastMouseYRef.current = y;

            send({ type: 'MOUSE_MOVE', clientX: event.clientX, clientY: event.clientY });
        } else if (state.matches('panning')) {
            if (lastMouseXRef.current !== null && lastMouseYRef.current !== null) {
                const deltaX = (event.clientX - lastMouseXRef.current) / canvas.width * 2;
                const deltaY = -(event.clientY - lastMouseYRef.current) / canvas.height * 2; // Adjust for WebGL's Y-axis

                // Accumulate the deltas to the existing pan offsets
                panOffsetRef.current.x += deltaX;
                panOffsetRef.current.y += deltaY;
                needsUpdateRef.current = true;

                sendMessage(encode(MessageType.PANNING, { x: deltaX, y: deltaY }));
            }

            lastMouseXRef.current = event.clientX;
            lastMouseYRef.current = event.clientY;

            console.log("Updated PanOffset:", panOffsetRef.current);
        } else {
            send({ type: 'MOUSE_MOVE', clientX: event.clientX, clientY: event.clientY });
            sendMessage(encode(MessageType.MOUSE_MOVE, { x: event.clientX, y: event.clientY }));
        }
    };

    const handleMouseUp = (send: any) => {
        lastMouseXRef.current = null;
        lastMouseYRef.current = null;
        send({ type: 'MOUSE_UP' });
    };

    const handleMouseLeave = (send: any) => {
        lastMouseXRef.current = null;
        lastMouseYRef.current = null;
        send({ type: 'MOUSE_LEAVE' });
    };

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
        handleKeyDown,
        handleKeyUp
    };
};

