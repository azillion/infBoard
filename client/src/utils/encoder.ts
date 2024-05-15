export const enum MessageType {
    NICKNAME = '/nick:',
    DRAWING = '/draw:',
}

export const encode = (type: MessageType, message: string) => {
    switch (type) {
        case MessageType.NICKNAME:
            return MessageType.NICKNAME + message;
        case MessageType.DRAWING:
            return MessageType.DRAWING + message;
    }
}
