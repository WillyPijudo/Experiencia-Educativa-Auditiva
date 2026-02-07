/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE: Onboarding
 * Descripción: Tutorial interactivo inicial que explica la app y solicita permisos
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Onboarding = ({ onComplete, usuarioData, setUsuarioData }) => {
  const [pasoActual, setPasoActual] = useState(0)
  const [permisoAudioOtorgado, setPermisoAudioOtorgado] = useState(false)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [mostrarInput, setMostrarInput] = useState(false)
  
  // ═══════════════════════════════════════════════════════════════════════
  // DEFINICIÓN DE PASOS DEL ONBOARDING
  // ═══════════════════════════════════════════════════════════════════════
  
  const pasos = [
    {
      id: 0,
      icono: '👋',
      titulo: '¡Bienvenido a LANXESS!',
      descripcion: 'Estás a punto de vivir una experiencia inmersiva que cambiará tu percepción sobre la protección auditiva.',
      subDescripcion: 'Esta aplicación fue diseñada para educarte sobre la importancia de proteger tu audición, tanto en el trabajo como en tu vida diaria.',
      accion: 'Comenzar',
      color: '#4CAF50'
    },
    {
      id: 1,
      icono: '🎯',
      titulo: '¿Qué aprenderás?',
      descripcion: 'En esta experiencia descubrirás:',
      lista: [
        '🔊 Cómo afectan los decibeles a tu audición',
        '🎧 La forma correcta de usar protección auditiva',
        '⚠️ Situaciones de riesgo en tu día a día',
        '📊 Cómo medir y monitorear el ruido a tu alrededor'
      ],
      accion: 'Entendido',
      color: '#2196F3'
    },
    {
      id: 2,
      icono: '🎤',
      titulo: 'Necesitamos tu permiso',
      descripcion: 'Para ofrecerte la mejor experiencia, necesitamos acceso a tu micrófono.',
      subDescripcion: 'Esto nos permite medir los niveles de ruido en tiempo real y crear una experiencia verdaderamente inmersiva. Tu privacidad está 100% protegida.',
      advertencia: '⚠️ Sin acceso al micrófono, algunas funciones estarán limitadas.',
      accion: 'Otorgar Permiso',
      color: '#FF9800',
      requierePermiso: true
    },
    {
      id: 3,
      icono: '😊',
      titulo: '¡Perfecto! Ahora personalicemos',
      descripcion: '¿Cómo te gustaría que te llamemos?',
      subDescripcion: 'Tu nombre nos ayudará a personalizar tu experiencia.',
      accion: 'Continuar',
      color: '#9C27B0',
      requiereNombre: true
    },
    {
      id: 4,
      icono: '🚀',
      titulo: `¡Listo, ${nombreUsuario || 'amigo'}!`,
      descripcion: 'Estás a punto de comenzar tu viaje hacia una audición más saludable.',
      subDescripcion: 'La experiencia dura aproximadamente 3-5 minutos. Te recomendamos usar audífonos para la mejor experiencia.',
      tips: [
        '💡 Encuentra un lugar tranquilo',
        '🎧 Usa audífonos si es posible',
        '🔋 Asegúrate de tener batería suficiente',
        '📱 Mantén el teléfono cerca'
      ],
      accion: 'Comenzar Experiencia',
      color: '#4CAF50',
      esUltimoPaso: true
    }
  ]
  
  const pasoActualData = pasos[pasoActual]
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES DE PERMISOS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Solicitar permiso de micrófono
   */
  const solicitarPermisoAudio = async () => {
    try {
      console.log('🎤 Solicitando permiso de micrófono...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Si llegamos aquí, el permiso fue otorgado
      setPermisoAudioOtorgado(true)
      console.log('✅ Permiso de micrófono otorgado')
      
      // Detener el stream inmediatamente (solo era para obtener permiso)
      stream.getTracks().forEach(track => track.stop())
      
      // Avanzar al siguiente paso automáticamente
      setTimeout(() => {
        siguientePaso()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Error al solicitar permiso de micrófono:', error)
      
      // Mostrar alerta amigable
      alert(
        '⚠️ No pudimos acceder al micrófono.\n\n' +
        'Para una experiencia completa, por favor:\n' +
        '1. Revisa la configuración de tu navegador\n' +
        '2. Permite el acceso al micrófono\n' +
        '3. Recarga la página\n\n' +
        'Puedes continuar sin el micrófono, pero algunas funciones estarán limitadas.'
      )
      
      setPermisoAudioOtorgado(false)
      
      // Permitir continuar de todos modos
      setTimeout(() => {
        siguientePaso()
      }, 500)
    }
  }
  
  /**
   * Verificar si ya tenemos permiso de micrófono
   */
  useEffect(() => {
    const verificarPermisos = async () => {
      try {
        const permisos = await navigator.permissions.query({ name: 'microphone' })
        if (permisos.state === 'granted') {
          setPermisoAudioOtorgado(true)
          console.log('✅ Permiso de micrófono ya otorgado previamente')
        }
      } catch (error) {
        console.log('ℹ️ No se pudo verificar permisos automáticamente')
      }
    }
    
    verificarPermisos()
  }, [])
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES DE NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Avanzar al siguiente paso
   */
  const siguientePaso = () => {
    // Si estamos en el paso que requiere permiso y no lo tenemos, solicitarlo primero
    if (pasoActualData.requierePermiso && !permisoAudioOtorgado) {
      solicitarPermisoAudio()
      return
    }
    
    // Si estamos en el paso que requiere nombre y no lo tenemos, validar
    if (pasoActualData.requiereNombre) {
      if (!nombreUsuario.trim()) {
        alert('Por favor ingresa tu nombre para continuar')
        return
      }
      
      // Guardar el nombre del usuario
      setUsuarioData(prev => ({
        ...prev,
        nombre: nombreUsuario.trim()
      }))
    }
    
    // Si es el último paso, completar onboarding
    if (pasoActualData.esUltimoPaso) {
      console.log('✅ Onboarding completado')
      onComplete()
      return
    }
    
    // Avanzar al siguiente paso
    if (pasoActual < pasos.length - 1) {
      setPasoActual(pasoActual + 1)
    }
  }
  
  /**
   * Retroceder al paso anterior
   */
  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1)
    }
  }
  
  /**
   * Saltar el onboarding (solo en desarrollo)
   */
  const saltarOnboarding = () => {
    if (window.confirm('¿Seguro que quieres saltar el tutorial?')) {
      onComplete()
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // ANIMACIONES Y VARIANTES
  // ═══════════════════════════════════════════════════════════════════════
  
  const variantesContenido = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  }
  
  const variantesIcono = {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    hover: { 
      scale: 1.1,
      rotate: [0, -10, 10, -10, 0],
      transition: { duration: 0.5 }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Indicador de progreso */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((pasoActual + 1) / pasos.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: pasoActualData.color,
            boxShadow: `0 0 20px ${pasoActualData.color}`
          }}
        />
      </div>
      
      {/* Contador de pasos */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '8px 16px',
          borderRadius: '20px',
          color: 'white',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        {pasoActual + 1} / {pasos.length}
      </motion.div>
      
      {/* Contenedor principal */}
      <motion.div
        style={{
          maxWidth: '600px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '50px 40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={pasoActual}
            custom={1}
            variants={variantesContenido}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center' }}
          >
            {/* Ícono principal */}
            <motion.div
              variants={variantesIcono}
              initial="initial"
              animate="animate"
              whileHover="hover"
              style={{
                fontSize: '100px',
                marginBottom: '30px',
                display: 'inline-block'
              }}
            >
              {pasoActualData.icono}
            </motion.div>
            
            {/* Título */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                textShadow: `0 0 20px ${pasoActualData.color}`
              }}
            >
              {pasoActualData.titulo}
            </motion.h2>
            
            {/* Descripción principal */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '18px',
                color: '#cccccc',
                marginBottom: '15px',
                lineHeight: '1.6'
              }}
            >
              {pasoActualData.descripcion}
            </motion.p>
            
            {/* Sub-descripción */}
            {pasoActualData.subDescripcion && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: '14px',
                  color: '#999999',
                  marginBottom: '25px',
                  lineHeight: '1.5'
                }}
              >
                {pasoActualData.subDescripcion}
              </motion.p>
            )}
            
            {/* Lista de puntos (si existe) */}
            {pasoActualData.lista && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '30px'
                }}
              >
                {pasoActualData.lista.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    style={{
                      fontSize: '16px',
                      color: '#ffffff',
                      marginBottom: '12px',
                      padding: '12px 20px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      textAlign: 'left',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            )}
            
            {/* Tips (si existen) */}
            {pasoActualData.tips && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  marginBottom: '30px'
                }}
              >
                {pasoActualData.tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    style={{
                      fontSize: '14px',
                      color: '#4CAF50',
                      marginBottom: '10px',
                      padding: '10px 15px',
                      background: 'rgba(76, 175, 80, 0.1)',
                      borderRadius: '8px',
                      textAlign: 'left',
                      border: '1px solid rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    {tip}
                  </motion.div>
                ))}
              </motion.div>
            )}
            
            {/* Advertencia (si existe) */}
            {pasoActualData.advertencia && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  padding: '15px',
                  background: 'rgba(255, 152, 0, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  marginBottom: '20px'
                }}
              >
                <p style={{ color: '#FF9800', fontSize: '14px', margin: 0 }}>
                  {pasoActualData.advertencia}
                </p>
              </motion.div>
            )}
            
            {/* Input de nombre (si es requerido) */}
            {pasoActualData.requiereNombre && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{ marginBottom: '30px' }}
              >
                <input
                  type="text"
                  placeholder="Escribe tu nombre aquí..."
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && siguientePaso()}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    fontSize: '16px',
                    borderRadius: '10px',
                    border: '2px solid rgba(156, 39, 176, 0.5)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#9C27B0'
                    e.target.style.boxShadow = '0 0 20px rgba(156, 39, 176, 0.3)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(156, 39, 176, 0.5)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </motion.div>
            )}
            
            {/* Indicador de permiso otorgado */}
            {pasoActualData.requierePermiso && permisoAudioOtorgado && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  marginBottom: '20px',
                  padding: '15px',
                  background: 'rgba(76, 175, 80, 0.2)',
                  borderRadius: '10px',
                  border: '1px solid rgba(76, 175, 80, 0.5)'
                }}
              >
                <p style={{ color: '#4CAF50', fontSize: '16px', margin: 0 }}>
                  ✅ Permiso otorgado correctamente
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Botones de navegación */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: '30px',
          display: 'flex',
          gap: '15px',
          maxWidth: '600px',
          width: '100%'
        }}
      >
        {/* Botón Atrás */}
        {pasoActual > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={pasoAnterior}
            style={{
              flex: 1,
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '10px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ← Atrás
          </motion.button>
        )}
        
        {/* Botón Principal */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${pasoActualData.color}` }}
          whileTap={{ scale: 0.95 }}
          onClick={siguientePaso}
          style={{
            flex: 3,
            padding: '15px 30px',
            fontSize: '18px',
            fontWeight: '700',
            borderRadius: '10px',
            border: 'none',
            background: pasoActualData.color,
            color: 'white',
            cursor: 'pointer',
            boxShadow: `0 10px 30px ${pasoActualData.color}40`,
            transition: 'all 0.3s ease'
          }}
        >
          {pasoActualData.accion} →
        </motion.button>
      </motion.div>
      
      {/* Botón de saltar (solo en desarrollo) */}
      {import.meta.env.DEV && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          whileHover={{ opacity: 1 }}
          onClick={saltarOnboarding}
          style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            padding: '8px 16px',
            fontSize: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Saltar Tutorial (DEV)
        </motion.button>
      )}
    </div>
  )
}

export default Onboarding
