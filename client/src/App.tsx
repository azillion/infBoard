import { useEffect } from 'react';
import { useMachine } from '@xstate/react';

import './App.css';
import Whiteboard from './components/Whiteboard';
import { WebRTCProvider } from './context/WebRTCContext';
import NicknameModal from './components/NicknameModal';
import appMachine from './state/appMachine';

function App() {
    const [state, _] = useMachine(appMachine);

    useEffect(() => {
        console.log('Current state:', state.value);
    }, [state]);

    return (
        <WebRTCProvider>
            <div className="App">
                <NicknameModal />
                <Whiteboard />
            </div>
        </WebRTCProvider>
    );
}

export default App;
