import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './estilos.css';

const raiz = document.getElementById('raiz')!;
createRoot(raiz).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
