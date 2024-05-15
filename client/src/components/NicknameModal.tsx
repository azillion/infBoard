import React from 'react';
import { useMachine } from '@xstate/react';

import appMachine from '../state/appMachine';
import { useWebRTC } from '../context/WebRTCContext';

const NicknameModal: React.FC = () => {
    const { sendMessage } = useWebRTC();
    const [state, send] = useMachine(appMachine);

    const handleSubmit = () => {
        send({ type: 'SUBMIT_NICKNAME' });
        sendMessage(`Nickname: ${state.context.nickname}`);
    };

    if (state.matches('nickname')) {
        return (
            <div>
                <h1>Enter your nickname</h1>
                <input
                    type="text"
                    value={state.context.nickname}
                    onChange={e => send({ type: 'SET_NICKNAME', nickname: e.target.value })}
                />
                <button onClick={handleSubmit}>Submit</button>
            </div>
        );
    }

    return null;
};

export default NicknameModal;
