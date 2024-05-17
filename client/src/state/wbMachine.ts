import { assign, createMachine } from 'xstate';

interface WhiteboardContext {
    offset: { x: number, y: number };
    startPos: { x: number, y: number };
    isPanning: boolean;
}

type WhiteboardEvent =
    | { type: 'MOUSE_DOWN'; clientX: number; clientY: number }
    | { type: 'MOUSE_MOVE'; clientX: number; clientY: number }
    | { type: 'MOUSE_UP' }
    | { type: 'MOUSE_LEAVE' }
    | { type: 'KEY_DOWN'; key: string }
    | { type: 'KEY_UP'; key: string };

const context: WhiteboardContext = {
    offset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 },
    isPanning: false,
};

const whiteboardMachine = createMachine(
    {
        id: 'whiteboard',
        initial: 'idle',
        context,
        types: {} as {
            context: WhiteboardContext;
            event: WhiteboardEvent;
        },
        states: {
            idle: {
                on: {
                    MOUSE_DOWN: {
                        target: 'drawing',
                        actions: 'setStartPos',
                        guard: 'isNotPanning',
                    },
                    KEY_DOWN: {
                        actions: 'checkIfPanning',
                        guard: 'isSpaceKey',
                        target: 'panning'
                    }
                }
            },
            drawing: {
                on: {
                    MOUSE_MOVE: {
                        actions: 'updateOffset'
                    },
                    MOUSE_UP: {
                        target: 'idle',
                        actions: 'resetStartPos'
                    },
                    MOUSE_LEAVE: {
                        target: 'idle',
                        actions: 'resetStartPos'
                    },
                    KEY_DOWN: {
                        actions: 'checkIfPanning'
                    }
                }
            },
            panning: {
                on: {
                    MOUSE_MOVE: {
                        actions: 'updateOffset'
                    },
                    KEY_UP: {
                        target: 'idle',
                        actions: 'stopPanning',
                        guard: 'isSpaceKey'
                    }
                }
            }
        }
    },
    {
        actions: {
            setStartPos: assign({
                startPos: ({ context, event }) => ({
                    x: event.clientX - context.offset.x,
                    y: event.clientY - context.offset.y
                })
            }),
            updateOffset: assign({
                offset: ({ context, event }) => ({
                    x: event.clientX - context.startPos.x,
                    y: event.clientY - context.startPos.y
                })
            }),
            resetStartPos: assign({
                startPos: () => ({ x: 0, y: 0 })
            }),
            checkIfPanning: assign({
                isPanning: ({ context, event }) => {
                    if (event.key === ' ') {
                        return true;
                    }
                    return context.isPanning;
                }
            }),
            stopPanning: assign({
                isPanning: () => false
            })
        },
        guards: {
            isNotPanning: ({ context }) => !context.isPanning,
            isSpaceKey: ({ event }) => event.key === ' '
        }
    }
);

export default whiteboardMachine;
