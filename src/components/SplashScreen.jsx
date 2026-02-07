/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE: SplashScreen
 * Descripción: Pantalla inicial de bienvenida con logo y animaciones
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const SplashScreen = () => {
  const [progreso, setProgreso] = useState(0)
  
  // Animación de carga progresiva
  useEffect(() => {
    const intervalo = setInterval(() => {
      setProgreso(prev => {
        if (prev >= 100) {
          clearInterval(intervalo)
          return 100
        }
        return prev + 2
      })
    }, 50)
    
    return () => clearInterval(intervalo)
  }, [])
  
  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1e 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Partículas de fondo animadas */}
      <div className="particles-background">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: '#4CAF50',
              pointerEvents: 'none'
            }}
          />
        ))}
      </div>
      
      {/* Logo principal con animación */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          textAlign: 'center',
          zIndex: 1
        }}
      >
        {/* Ícono de auriculares animado */}
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
          style={{
            fontSize: '120px',
            marginBottom: '30px'
          }}
        >
          🎧
        </motion.div>
        
        {/* Título principal */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '10px',
            textShadow: '0 0 20px rgba(76, 175, 80, 0.5)'
          }}
        >
          LANXESS
        </motion.h1>
        
        {/* Subtítulo */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            fontSize: '20px',
            color: '#b0b0b0',
            marginBottom: '50px'
          }}
        >
          Protección Auditiva
        </motion.p>
      </motion.div>
      
      {/* Barra de carga */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '300px', opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{
          width: '300px',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1
        }}
      >
        <motion.div
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.3 }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)',
            borderRadius: '10px',
            boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
          }}
        />
      </motion.div>
      
      {/* Porcentaje de carga */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        style={{
          marginTop: '15px',
          color: '#4CAF50',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1
        }}
      >
        {progreso}%
      </motion.p>
      
      {/* Mensaje motivacional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        style={{
          position: 'absolute',
          bottom: '50px',
          textAlign: 'center',
          color: '#888',
          fontSize: '14px',
          zIndex: 1
        }}
      >
        <p>Protege tu audición, protege tu futuro</p>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ marginTop: '10px', fontSize: '20px' }}
        >
          ↓
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default SplashScreen
