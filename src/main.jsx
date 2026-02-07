import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Configuración global de errores
window.addEventListener('error', (event) => {
  console.error('Error global capturado:', event.error);
});

// Configuración global de promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no manejada:', event.reason);
});

// Detectar si es PWA instalada
const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
              window.navigator.standalone === true;

if (isPWA) {
  console.log('App ejecutándose como PWA instalada');
  document.body.classList.add('pwa-mode');
}

// Detectar tipo de dispositivo
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isAndroid = /Android/.test(navigator.userAgent);

// Agregar clases al body para CSS específico de plataforma
if (isMobile) document.body.classList.add('mobile');
if (isIOS) document.body.classList.add('ios');
if (isAndroid) document.body.classList.add('android');

// Detectar orientación
window.addEventListener('orientationchange', () => {
  const orientation = window.orientation === 0 || window.orientation === 180 ? 'portrait' : 'landscape';
  document.body.setAttribute('data-orientation', orientation);
});

// Set initial orientation
const initialOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
document.body.setAttribute('data-orientation', initialOrientation);

// Deshabilitar el menú contextual en dispositivos móviles
if (isMobile) {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

// Prevenir comportamiento de "pull to refresh" en iOS
document.body.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

let lastTouchEnd = 0;
document.body.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Renderizar la aplicación
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log de información del dispositivo (útil para debugging)
console.log('Información del dispositivo:', {
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  screen: `${window.screen.width}x${window.screen.height}`,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  pixelRatio: window.devicePixelRatio,
  touchSupport: 'ontouchstart' in window,
  isPWA: isPWA,
  isMobile: isMobile,
  isIOS: isIOS,
  isAndroid: isAndroid
});
