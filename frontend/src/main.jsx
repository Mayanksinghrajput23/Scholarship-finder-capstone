import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { NotifyProvider } from './context/NotifyContext';
import { LangProvider } from './i18n';
import { initTheme } from './components/Toggles';
import './styles.css';

initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <NotifyProvider>
            <App />
          </NotifyProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>
);
