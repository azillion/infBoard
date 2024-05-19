import './App.css';
import Whiteboard from './components/Whiteboard';
import NicknameModal from './components/NicknameModal';
import { AppContext } from './context/AppContext';

function App() {
    const state = AppContext.useSelector((state) => state)
    return (
        <div className="app">
            {state.matches('loading') && <h1>Loading...</h1>}
            {state.matches('nickname') && <NicknameModal />}
            {state.matches('drawing') && <Whiteboard />}
        </div>
    );
}

export default App;
