import { DrawingMessage, MessageType, PanningMessage, NicknameMessage, MouseMoveMessage, isMouseMoveMessage, isPanningMessage, isDrawingMessage } from '../models/message';

export const encode = (type: MessageType, message: string | DrawingMessage | PanningMessage | NicknameMessage | MouseMoveMessage): string => {
    switch (type) {
        case MessageType.NICKNAME:
            return `${MessageType.NICKNAME}:${message}`;
        case MessageType.MOUSE_MOVE:
            if (isMouseMoveMessage(message)) {
                const msg = `${message.x},${message.y}`;
                return `${MessageType.MOUSE_MOVE}:${msg}`;
            }
            break;
        case MessageType.PANNING:
            if (isPanningMessage(message)) {
                const msg = `${message.x},${message.y}`;
                return `${MessageType.PANNING}:${msg}`;
            }
            break;
        case MessageType.DRAWING:
            if (isDrawingMessage(message)) {
                const msg = `${message.x},${message.y},${message.panX},${message.panY}`;
                return `${MessageType.DRAWING}:${msg}`;
            }
            break;
        default:
            return '';
    }
    return '';
}


