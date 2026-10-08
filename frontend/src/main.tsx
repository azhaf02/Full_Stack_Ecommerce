import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// @ts-ignore
import 'bootstrap/dist/css/bootstrap.min.css';
// @ts-ignore
import 'bootstrap-icons/font/bootstrap-icons.css';
// @ts-ignore
import './index.css';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
