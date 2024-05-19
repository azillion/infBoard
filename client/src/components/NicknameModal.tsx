import React, { useEffect } from 'react';

import { useWebRTC } from '../context/WebRTCContext';
import { encode } from '../utils/encoder';
import { MessageType } from '../models/message';
import { AppContext } from '../context/AppContext';

const NicknameModal: React.FC = () => {
    const { sendMessage } = useWebRTC();
    const appContextRef = AppContext.useActorRef();
    const state = AppContext.useSelector((state) => state)

    useEffect(() => {
        if (state.matches('loading')) {
            return;
        }
        const nickname = localStorage.getItem('nickname');
        if (nickname) {
            sendMessage(encode(MessageType.NICKNAME, nickname));
        }
    }, [sendMessage]);

    const handleSubmit = () => {
        appContextRef.send({ type: 'SUBMIT_NICKNAME' });
        sendMessage(encode(MessageType.NICKNAME, state.context.nickname));
    };

    return (
        <div>
            <h1>Enter your nickname</h1>
            <input
                type="text"
                value={state.context.nickname}
                onChange={e => appContextRef.send({ type: 'SET_NICKNAME', nickname: e.target.value })}
            />
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
};

export default NicknameModal;
