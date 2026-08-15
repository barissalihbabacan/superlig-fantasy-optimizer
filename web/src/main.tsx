import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initAnalytics } from './services/firebase';
import './styles/index.css';

// Initialize Firebase Analytics
initAnalytics().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
