import './App.css';
import Whiteboard from './components/Whiteboard';
import { WebRTCProvider } from './context/WebRTCContext';
import NicknameModal from './components/NicknameModal';

function App() {
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
