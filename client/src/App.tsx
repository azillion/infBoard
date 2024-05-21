import './App.css';
import Whiteboard from './components/whiteboard';
import { AppContext } from './context/AppContext';

function App() {
    const state = AppContext.useSelector((state) => state)
    return (
        <div className="app">
            {state.matches('loading') && <h1>Loading...</h1>}
            {state.matches('drawing') && <Whiteboard />}
        </div>
    );
}

export default App;
