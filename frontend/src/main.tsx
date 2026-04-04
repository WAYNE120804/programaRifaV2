import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppConfigProvider } from './context/AppConfigContext';
import { AuthProvider } from './context/AuthContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppConfigProvider>
        <App />
      </AppConfigProvider>
    </AuthProvider>
  </React.StrictMode>
);
