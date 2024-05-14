import { assign, createMachine } from 'xstate';

interface WhiteboardContext {
    offset: { x: number, y: number };
    startPos: { x: number, y: number };
}

type WhiteboardEvent =
    | { type: 'MOUSE_DOWN'; clientX: number; clientY: number }
    | { type: 'MOUSE_MOVE'; clientX: number; clientY: number }
    | { type: 'MOUSE_UP' }
    | { type: 'MOUSE_LEAVE' };

const context: WhiteboardContext = {
    offset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 }
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
                        target: 'panning',
                        actions: 'setStartPos'
                    }
                }
            },
            panning: {
                on: {
                    MOUSE_MOVE: {
                        actions: 'updateOffset'
                    },
                    MOUSE_UP: {
                        target: 'idle'
                    },
                    MOUSE_LEAVE: {
                        target: 'idle'
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
            })
        }
    }
);

export default whiteboardMachine;
