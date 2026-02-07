/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE: Navegacion
 * Descripción: Barra de navegación superior con menú y estadísticas
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Navegacion = ({ pantallaActual, irAPantalla, progresoTotal, estadisticas }) => {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false)
  
  const PANTALLAS = {
    EXPERIENCIA: 'experiencia',
    MENSAJE_FINAL: 'mensaje_final',
    MEDIDOR_REAL: 'medidor_real'
  }
  
  return (
    <>
      {/* Barra de navegación fija */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '15px 20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Logo y título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '28px' }}>🎧</div>
          <div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
              LANXESS
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              Protección Auditiva
            </div>
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div
          style={{
            flex: 1,
            maxWidth: '300px',
            margin: '0 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
        >
          <div style={{ color: '#888', fontSize: '11px', textAlign: 'center' }}>
            Progreso: {progresoTotal}%
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}
          >
            <motion.div
              animate={{ width: `${progresoTotal}%` }}
              transition={{ duration: 0.5 }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
              }}
            />
          </div>
        </div>
        
        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Botón de estadísticas */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
            style={{
              padding: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            📊
          </motion.button>
          
          {/* Botón de menú */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuAbierto(!menuAbierto)}
            style={{
              padding: '10px 15px',
              background: 'rgba(76, 175, 80, 0.2)',
              border: '1px solid rgba(76, 175, 80, 0.4)',
              borderRadius: '10px',
              color: '#4CAF50',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600'
            }}
          >
            {menuAbierto ? '✕' : '☰'}
          </motion.button>
        </div>
      </motion.nav>
      
      {/* Menú desplegable */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            style={{
              position: 'fixed',
              top: '70px',
              right: '20px',
              width: '280px',
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '15px',
              padding: '20px',
              zIndex: 999,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>
              🧭 Navegación
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                onClick={() => {
                  irAPantalla(PANTALLAS.EXPERIENCIA)
                  setMenuAbierto(false)
                }}
                disabled={pantallaActual === PANTALLAS.EXPERIENCIA}
                style={{
                  padding: '12px 15px',
                  background: pantallaActual === PANTALLAS.EXPERIENCIA 
                    ? 'rgba(76, 175, 80, 0.3)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: pantallaActual === PANTALLAS.EXPERIENCIA
                    ? '2px solid #4CAF50'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: pantallaActual === PANTALLAS.EXPERIENCIA ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: pantallaActual === PANTALLAS.EXPERIENCIA ? 0.7 : 1
                }}
              >
                🎬 Experiencia Inmersiva
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, x: 5 }}
                onClick={() => {
                  irAPantalla(PANTALLAS.MEDIDOR_REAL)
                  setMenuAbierto(false)
                }}
                disabled={pantallaActual === PANTALLAS.MEDIDOR_REAL}
                style={{
                  padding: '12px 15px',
                  background: pantallaActual === PANTALLAS.MEDIDOR_REAL 
                    ? 'rgba(33, 150, 243, 0.3)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: pantallaActual === PANTALLAS.MEDIDOR_REAL
                    ? '2px solid #2196F3'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: pantallaActual === PANTALLAS.MEDIDOR_REAL ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: pantallaActual === PANTALLAS.MEDIDOR_REAL ? 0.7 : 1
                }}
              >
                📱 Medidor de Decibeles
              </motion.button>
            </div>
            
            <div
              style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <a
                href="https://www.lanxess.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 15px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#888',
                  textDecoration: 'none',
                  fontSize: '14px',
                  textAlign: 'center'
                }}
              >
                🌐 Sitio Web LANXESS
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Panel de estadísticas */}
      <AnimatePresence>
        {mostrarEstadisticas && estadisticas && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '70px',
              right: '20px',
              width: '300px',
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '15px',
              padding: '25px',
              zIndex: 999,
              border: '1px solid rgba(76, 175, 80, 0.3)',
              boxShadow: '0 10px 40px rgba(76, 175, 80, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#4CAF50', fontSize: '18px', margin: 0 }}>
                📊 Tus Estadísticas
              </h3>
              <button
                onClick={() => setMostrarEstadisticas(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div
                style={{
                  padding: '15px',
                  background: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(76, 175, 80, 0.3)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>
                  LOGROS DESBLOQUEADOS
                </div>
                <div style={{ color: '#4CAF50', fontSize: '32px', fontWeight: 'bold' }}>
                  {estadisticas.logrosTotal}
                </div>
              </div>
              
              <div
                style={{
                  padding: '15px',
                  background: 'rgba(33, 150, 243, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(33, 150, 243, 0.3)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>
                  VISITAS A LA APP
                </div>
                <div style={{ color: '#2196F3', fontSize: '32px', fontWeight: 'bold' }}>
                  {estadisticas.visitas}
                </div>
              </div>
              
              <div
                style={{
                  padding: '15px',
                  background: 'rgba(255, 152, 0, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 152, 0, 0.3)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>
                  TIEMPO EN AMBIENTE SEGURO
                </div>
                <div style={{ color: '#FF9800', fontSize: '32px', fontWeight: 'bold' }}>
                  {estadisticas.porcentajeSeguro}%
                </div>
              </div>
              
              <div
                style={{
                  padding: '15px',
                  background: 'rgba(156, 39, 176, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(156, 39, 176, 0.3)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>
                  HORAS TOTALES REGISTRADAS
                </div>
                <div style={{ color: '#9C27B0', fontSize: '28px', fontWeight: 'bold' }}>
                  {estadisticas.totalHoras.toFixed(1)} hrs
                </div>
              </div>
            </div>
            
            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '10px',
                textAlign: 'center'
              }}
            >
              <p style={{ color: '#4CAF50', fontSize: '12px', margin: 0 }}>
                ¡Sigue cuidando tu audición! 💚
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navegacion
