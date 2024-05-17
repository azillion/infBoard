export const enum MessageType {
    NICKNAME = '/nick:',
    MOUSE_MOVE = '/move:',
    PANNING = '/pan:',
    DRAWING = '/draw:',
}

export const encode = (type: MessageType, message: string) => {
    switch (type) {
        case MessageType.NICKNAME:
            return MessageType.NICKNAME + message;
        case MessageType.MOUSE_MOVE:
            return MessageType.MOUSE_MOVE + message;
        case MessageType.PANNING:
            return MessageType.PANNING + message;
        case MessageType.DRAWING:
            return MessageType.DRAWING + message;
    }
}
