import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppContext } from './context/AppContext.tsx'
import { WebRTCProvider } from './context/WebRTCContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AppContext.Provider>
            <WebRTCProvider>
                <App />
            </WebRTCProvider>
        </AppContext.Provider>
    </React.StrictMode>,
)
