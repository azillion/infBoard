import './App.css';
import Whiteboard from './components/whiteboard';
import { WebRTCProvider } from './context/WebRTCContext';

function App() {
    return (
        <WebRTCProvider>
            <Whiteboard />
        </WebRTCProvider>
    );
}

export default App;
