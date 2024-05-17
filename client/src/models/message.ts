export const enum MessageType {
    NICKNAME = '/nick:',
    MOUSE_MOVE = '/move:',
    PANNING = '/pan:',
    DRAWING = '/draw:',
};

type Point = {
    x: number;
    y: number;
};

export type DrawingMessage = Point & {
    panX: number;
    panY: number;
};
export type PanningMessage = Point;
export type MouseMoveMessage = Point;
export type NicknameMessage = string;

export const isDrawingMessage = (message: any): message is DrawingMessage => {
    return 'x' in message && 'y' in message && 'panX' in message && 'panY' in message;
}

export const isPanningMessage = (message: any): message is PanningMessage => {
    return 'x' in message && 'y' in message;
}

export const isMouseMoveMessage = (message: any): message is MouseMoveMessage => {
    return 'x' in message && 'y' in message;
}
