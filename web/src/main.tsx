import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initAnalytics, initPerformance } from './services/firebase';
import './styles/index.css';

// Initialize Firebase Analytics & Performance Monitoring
initAnalytics().catch(() => {});
initPerformance().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
