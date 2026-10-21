import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import '@fontsource/bricolage-grotesque/600.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/source-sans-3/700.css';
import '@fontsource/noto-nastaliq-urdu/400.css';
import '@fontsource/noto-nastaliq-urdu/700.css';
import './styles/global.css';
import App from './App';
import { I18nProvider } from './i18n/I18nContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui';

// "hash" (default) works on any static host without server rewrites; set VITE_ROUTER=browser for clean URLs.
const Router = import.meta.env.VITE_ROUTER === 'browser' ? BrowserRouter : HashRouter;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <I18nProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </I18nProvider>
    </Router>
  </React.StrictMode>,
);
