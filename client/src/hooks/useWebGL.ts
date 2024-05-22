import { useEffect, useRef, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { useWebRTC } from '../context/WebRTCContext';
import whiteboardMachine from '../state/wbMachine';
import { EventType } from '../models/event';

const STEP = 0.005;

/**
 * useWebGL Custom Hook
 * 
 * This hook sets up and manages a WebGL context for drawing on a canvas. It integrates with a WebRTC
 * data channel to synchronize drawing and panning actions across multiple clients. The hook also interacts 
 * with a state machine (whiteboardMachine) to manage different states like drawing and panning.
 * 
 * Key functionalities:
 * - Initialize WebGL context and shaders.
 * - Handle window resize events to adjust the canvas size and viewport.
 * - Capture mouse events for drawing and panning.
 * - Send drawing and panning data to other clients via WebRTC data channel.
 * - Receive and process drawing and panning data from other clients.
 * 
 * Dependencies:
 * - useWebRTC: Custom hook for WebRTC data channel communication.
 * - whiteboardMachine: XState state machine managing drawing and panning states.
 * - EventType: Enum representing different types of events/messages.
 */
export const useWebGL = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    const { sendMessage, onMessage } = useWebRTC();
    const [state, send] = useMachine(whiteboardMachine);
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
    const panStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const addPoint = useCallback((x: number, y: number) => {
        positionsRef.current.push(x, y);
        needsUpdateRef.current = true;
    }, []);

    const interpolatePoints = useCallback((x0: number, y0: number, x1: number, y1: number) => {
        const distance = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0));
        const steps = Math.ceil(distance / STEP);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = x0 + t * (x1 - x0);
            const y = y0 + t * (y1 - y0);
            addPoint(x, y);
            sendMessage(EventType.DRAWING, JSON.stringify({ x, y, offsetX: panOffsetRef.current.x, offsetY: panOffsetRef.current.y }));
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

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [animate, canvasRef]);

    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        const gl = glRef.current;
        if (!canvas || !gl) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        drawScene();
    }, [drawScene]);

    const handleMouseDown = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        lastMouseXRef.current = null;
        lastMouseYRef.current = null;
        const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
        panStartMouseRef.current = { x: clientX, y: clientY };
        startPanOffsetRef.current = { ...panOffsetRef.current };
        send({ type: 'MOUSE_DOWN', clientX, clientY });
    }, [send]);

    const handleMouseMove = useCallback((event: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'clientX' in event ? event.clientX : event.touches[0].clientX;
        const clientY = 'clientY' in event ? event.clientY : event.touches[0].clientY;
        const canvas = canvasRef.current!;
        const { x, y } = getWebGLCoordinates(canvas, clientX, clientY);
        const adjustedX = x - panOffsetRef.current.x;
        const adjustedY = y - panOffsetRef.current.y;

        let isLeftButton = true;
        if ('button' in event) {
            isLeftButton = event.button === 0;
        } else if ('buttons' in event) {
            isLeftButton = event.buttons === 1;
        }

        if (isLeftButton) {
            if (state.matches('panning')) {
                const deltaX = (clientX - panStartMouseRef.current.x) / canvas.width * 2;
                const deltaY = -(clientY - panStartMouseRef.current.y) / canvas.height * 2;

                panOffsetRef.current = {
                    x: startPanOffsetRef.current.x + deltaX,
                    y: startPanOffsetRef.current.y + deltaY,
                };
                needsUpdateRef.current = true;

                sendMessage(EventType.PANNING, JSON.stringify({ x: deltaX, y: deltaY }));
            } else if (state.matches('drawing')) {
                if (lastMouseXRef.current !== null && lastMouseYRef.current !== null) {
                    interpolatePoints(lastMouseXRef.current, lastMouseYRef.current, adjustedX, adjustedY);
                } else {
                    addPoint(adjustedX, adjustedY);
                    sendMessage(EventType.DRAWING, JSON.stringify({ x, y, offsetX: panOffsetRef.current.x, offsetY: panOffsetRef.current.y }));
                }

                lastMouseXRef.current = adjustedX;
                lastMouseYRef.current = adjustedY;
            }

            // TODO: send mouse location to other clients
            send({ type: 'MOUSE_MOVE', clientX, clientY });
        }
    }, [state, send, sendMessage, interpolatePoints, addPoint]);

    const handleMouseUp = useCallback(() => {
        lastMouseXRef.current = null;
        lastMouseYRef.current = null;
        send({ type: 'MOUSE_UP' });
    }, [send]);

    const handleMouseLeave = useCallback(() => {
        lastMouseXRef.current = null;
        lastMouseYRef.current = null;
        send({ type: 'MOUSE_LEAVE' });
    }, [send]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        send({ type: 'KEY_DOWN', key: event.key });
    }, [send]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        send({ type: 'KEY_UP', key: event.key });
    }, [send]);

    useEffect(() => {
        const cleanup = setupWebGL();
        return () => {
            if (cleanup) cleanup();
        }
    }, [setupWebGL]);

    useEffect(() => {
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    useEffect(() => {
        onMessage((type, data) => {
            if (type === "drawing") {
                const { x: adjustedX, y: adjustedY } = adjustForPan(data.x, data.y, data.offsetX, data.offsetY);
                addPoint(adjustedX, adjustedY);
            }
        });
    }, [onMessage, addPoint]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
    };
};

const getWebGLCoordinates = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * 2 - 1;
    const y = -((clientY - rect.top) / rect.height * 2 - 1); // Flip Y-axis for WebGL coordinates
    return { x, y };
};

const adjustForPan = (x: number, y: number, panX: number, panY: number) => {
    return {
        x: x - panX,
        y: y - panY
    };
};

