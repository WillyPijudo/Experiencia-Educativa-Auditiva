/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE: InstallPrompt
 * Descripción: Prompt para instalar la PWA en el dispositivo
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const InstallPrompt = () => {
  const [mostrarPrompt, setMostrarPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [esIOS, setEsIOS] = useState(false)
  
  useEffect(() => {
    // Detectar si es iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setEsIOS(iOS)
    
    // Verificar si ya fue rechazado anteriormente
    const promptRechazado = localStorage.getItem('lanxess_install_prompt_dismissed')
    
    if (promptRechazado) {
      return
    }
    
    // Escuchar evento de instalación
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Esperar 10 segundos antes de mostrar el prompt
      setTimeout(() => {
        setMostrarPrompt(true)
      }, 10000)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])
  
  const handleInstalar = async () => {
    if (!deferredPrompt) {
      return
    }
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt()
    
    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`)
    
    // Limpiar el prompt
    setDeferredPrompt(null)
    setMostrarPrompt(false)
  }
  
  const handleDismiss = () => {
    setMostrarPrompt(false)
    localStorage.setItem('lanxess_install_prompt_dismissed', 'true')
  }
  
  const handleRecordarDespues = () => {
    setMostrarPrompt(false)
    // No guardar en localStorage para que aparezca de nuevo
  }
  
  return (
    <AnimatePresence>
      {mostrarPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '450px',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '2px solid rgba(76, 175, 80, 0.3)',
            zIndex: 9999
          }}
        >
          {/* Icono y título */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              style={{ fontSize: '60px', marginBottom: '15px' }}
            >
              📱
            </motion.div>
            
            <h3 style={{ color: 'white', fontSize: '22px', marginBottom: '10px', fontWeight: 'bold' }}>
              {esIOS ? 'Agregar a Pantalla de Inicio' : 'Instalar App'}
            </h3>
            
            <p style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.6 }}>
              {esIOS 
                ? 'Accede rápidamente a la experiencia desde tu pantalla de inicio'
                : 'Instala esta app en tu dispositivo para acceso rápido y funcionalidad offline'
              }
            </p>
          </div>
          
          {/* Instrucciones para iOS */}
          {esIOS && (
            <div
              style={{
                padding: '15px',
                background: 'rgba(33, 150, 243, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                marginBottom: '20px'
              }}
            >
              <p style={{ color: '#2196F3', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
                📌 <strong>Cómo agregar:</strong><br/>
                1. Toca el botón <strong>Compartir</strong> 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#2196F3" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 5px' }}>
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                </svg><br/>
                2. Selecciona <strong>"Agregar a pantalla de inicio"</strong><br/>
                3. Confirma tocando <strong>"Agregar"</strong>
              </p>
            </div>
          )}
          
          {/* Características */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ color: '#4CAF50', fontSize: '16px' }}>✓</div>
              <div style={{ color: '#ccc', fontSize: '13px', flex: 1 }}>
                Acceso instantáneo desde tu pantalla de inicio
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ color: '#4CAF50', fontSize: '16px' }}>✓</div>
              <div style={{ color: '#ccc', fontSize: '13px', flex: 1 }}>
                Funciona sin conexión después de la primera carga
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ color: '#4CAF50', fontSize: '16px' }}>✓</div>
              <div style={{ color: '#ccc', fontSize: '13px', flex: 1 }}>
                Experiencia similar a una app nativa
              </div>
            </div>
          </div>
          
          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {!esIOS && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstalar}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '16px',
                  fontWeight: '700',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)'
                }}
              >
                Instalar
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRecordarDespues}
              style={{
                flex: esIOS ? 1 : 0,
                padding: '15px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {esIOS ? 'Entendido' : 'Después'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDismiss}
              style={{
                padding: '15px',
                fontSize: '18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#888',
                cursor: 'pointer'
              }}
            >
              ✕
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default InstallPrompt
