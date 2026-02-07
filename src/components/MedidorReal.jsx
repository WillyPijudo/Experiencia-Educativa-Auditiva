/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE: MedidorReal
 * Descripción: Herramienta diaria que usa el micrófono REAL del dispositivo
 *              para medir niveles de decibeles en tiempo real
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MedidorReal = ({ usuarioData, actualizarExposicion, desbloquearLogro, onVolverExperiencia }) => {
  // ═══════════════════════════════════════════════════════════════════════
  // ESTADOS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════
  
  const [midiendo, setMidiendo] = useState(false)
  const [decibeles, setDecibeles] = useState(30)
  const [decibelesMaximo, setDecibelesMaximo] = useState(30)
  const [decibelesPromedio, setDecibelesPromedio] = useState(30)
  const [tiempoMedicion, setTiempoMedicion] = useState(0)
  const [permisoMicrofono, setPermisoMicrofono] = useState(false)
  const [error, setError] = useState(null)
  const [historial, setHistorial] = useState([])
  const [alertaActiva, setAlertaActiva] = useState(false)
  const [mostrarTips, setMostrarTips] = useState(true)
  const [calibracion, setCalibracion] = useState(0)
  
  // Referencias
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)
  const animationFrameRef = useRef(null)
  const medicionesRef = useRef([])
  const timerRef = useRef(null)
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILIDADES Y HELPERS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Calcular decibeles a partir de los datos del micrófono
   */
  const calcularDecibeles = (dataArray) => {
    // Calcular RMS (Root Mean Square)
    let suma = 0
    for (let i = 0; i < dataArray.length; i++) {
      suma += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(suma / dataArray.length)
    
    // Convertir a decibeles (con calibración)
    // La fórmula típica es: dB = 20 * log10(RMS / referencia)
    let db = 20 * Math.log10(rms + 1)
    
    // Normalizar al rango típico de 30-120 dB
    db = Math.max(30, Math.min(120, db + 30 + calibracion))
    
    return Math.round(db)
  }
  
  /**
   * Obtener color según nivel de decibeles
   */
  const getColorDB = (db) => {
    if (db < 60) return '#4CAF50' // Verde - Seguro
    if (db < 75) return '#2196F3' // Azul - Normal
    if (db < 85) return '#FF9800' // Naranja - Atención
    if (db < 100) return '#F44336' // Rojo - Peligro
    return '#9C27B0' // Morado - Crítico
  }
  
  /**
   * Obtener nivel de riesgo
   */
  const getNivelRiesgo = (db) => {
    if (db < 60) return { nivel: 'SEGURO', emoji: '✅', color: '#4CAF50' }
    if (db < 75) return { nivel: 'NORMAL', emoji: 'ℹ️', color: '#2196F3' }
    if (db < 85) return { nivel: 'ATENCIÓN', emoji: '⚠️', color: '#FF9800' }
    if (db < 100) return { nivel: 'PELIGRO', emoji: '🚨', color: '#F44336' }
    return { nivel: 'CRÍTICO', emoji: '☢️', color: '#9C27B0' }
  }
  
  /**
   * Obtener recomendación según nivel
   */
  const getRecomendacion = (db) => {
    if (db < 60) return 'Nivel seguro. Continúa así.'
    if (db < 75) return 'Nivel normal. No hay riesgo inmediato.'
    if (db < 85) return 'Nivel elevado. Limite la exposición a 8 horas.'
    if (db < 95) return '¡Cuidado! Use protección si la exposición es prolongada (más de 2 horas).'
    if (db < 100) return '¡PELIGRO! Use protección auditiva INMEDIATAMENTE. Máximo 30 minutos de exposición.'
    return '¡CRÍTICO! Abandone el área o use protección AHORA. Daño inmediato posible.'
  }
  
  /**
   * Obtener tiempo de exposición segura
   */
  const getTiempoSeguro = (db) => {
    if (db < 85) return 'Sin límite (con descansos)'
    if (db < 88) return '8 horas'
    if (db < 91) return '4 horas'
    if (db < 94) return '2 horas'
    if (db < 97) return '1 hora'
    if (db < 100) return '30 minutos'
    if (db < 103) return '15 minutos'
    if (db < 106) return '7.5 minutos'
    return 'Menos de 5 minutos'
  }
  
  /**
   * Formatear tiempo
   */
  const formatearTiempo = (segundos) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES DE AUDIO Y MICRÓFONO
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Inicializar el medidor de audio
   */
  const iniciarMedidor = async () => {
    try {
      console.log('🎤 Solicitando acceso al micrófono...')
      setError(null)
      
      // Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      })
      
      console.log('✅ Acceso al micrófono otorgado')
      setPermisoMicrofono(true)
      
      // Crear contexto de audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      
      // Crear analizador
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser
      
      // Conectar micrófono al analizador
      const microphone = audioContext.createMediaStreamSource(stream)
      microphoneRef.current = microphone
      microphone.connect(analyser)
      
      console.log('🎵 Analizador de audio configurado')
      
      // Iniciar medición
      setMidiendo(true)
      medirDecibeles()
      
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setTiempoMedicion(prev => prev + 1)
      }, 1000)
      
      // Desbloquear logro
      desbloquearLogro('medidor_iniciado')
      
    } catch (err) {
      console.error('❌ Error al acceder al micrófono:', err)
      
      let mensajeError = 'No se pudo acceder al micrófono. '
      
      if (err.name === 'NotAllowedError') {
        mensajeError += 'Por favor, permite el acceso al micrófono en la configuración de tu navegador.'
      } else if (err.name === 'NotFoundError') {
        mensajeError += 'No se detectó ningún micrófono en tu dispositivo.'
      } else {
        mensajeError += 'Verifica que otro programa no esté usando el micrófono.'
      }
      
      setError(mensajeError)
      setPermisoMicrofono(false)
    }
  }
  
  /**
   * Medir decibeles continuamente
   */
  const medirDecibeles = () => {
    if (!analyserRef.current) return
    
    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const medir = () => {
      if (!midiendo) return
      
      // Obtener datos de frecuencia
      analyser.getByteFrequencyData(dataArray)
      
      // Calcular decibeles
      const dbActual = calcularDecibeles(dataArray)
      
      // Actualizar estado
      setDecibeles(dbActual)
      
      // Actualizar máximo
      setDecibelesMaximo(prev => Math.max(prev, dbActual))
      
      // Guardar en array para calcular promedio
      medicionesRef.current.push(dbActual)
      if (medicionesRef.current.length > 100) {
        medicionesRef.current.shift() // Mantener solo las últimas 100 mediciones
      }
      
      // Calcular promedio
      const promedio = Math.round(
        medicionesRef.current.reduce((a, b) => a + b, 0) / medicionesRef.current.length
      )
      setDecibelesPromedio(promedio)
      
      // Verificar si hay alerta
      if (dbActual >= 85) {
        setAlertaActiva(true)
        
        // Registrar exposición según nivel
        if (dbActual >= 100) {
          actualizarExposicion('peligro', 1/3600) // 1 segundo en horas
        } else {
          actualizarExposicion('riesgo', 1/3600)
        }
      } else {
        setAlertaActiva(false)
        actualizarExposicion('seguras', 1/3600)
      }
      
      // Continuar midiendo
      animationFrameRef.current = requestAnimationFrame(medir)
    }
    
    medir()
  }
  
  /**
   * Detener el medidor
   */
  const detenerMedidor = () => {
    console.log('⏹️ Deteniendo medidor')
    
    setMidiendo(false)
    
    // Cancelar animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // Detener timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Cerrar audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    // Detener micrófono
    if (microphoneRef.current && microphoneRef.current.mediaStream) {
      microphoneRef.current.mediaStream.getTracks().forEach(track => track.stop())
    }
    
    // Guardar medición en historial
    if (tiempoMedicion > 5) {
      const medicion = {
        fecha: new Date().toLocaleString('es-AR'),
        duracion: tiempoMedicion,
        promedio: decibelesPromedio,
        maximo: decibelesMaximo,
        riesgo: getNivelRiesgo(decibelesPromedio).nivel
      }
      
      setHistorial(prev => [medicion, ...prev.slice(0, 9)]) // Mantener últimas 10
      
      // Desbloquear logros
      if (tiempoMedicion > 60) desbloquearLogro('medicion_1min')
      if (tiempoMedicion > 300) desbloquearLogro('medicion_5min')
    }
  }
  
  /**
   * Reiniciar medición
   */
  const reiniciarMedicion = () => {
    setDecibeles(30)
    setDecibelesMaximo(30)
    setDecibelesPromedio(30)
    setTiempoMedicion(0)
    medicionesRef.current = []
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      if (midiendo) {
        detenerMedidor()
      }
    }
  }, [])
  
  /**
   * Cargar historial desde localStorage
   */
  useEffect(() => {
    const historialGuardado = localStorage.getItem('lanxess_historial_mediciones')
    if (historialGuardado) {
      setHistorial(JSON.parse(historialGuardado))
    }
  }, [])
  
  /**
   * Guardar historial en localStorage
   */
  useEffect(() => {
    if (historial.length > 0) {
      localStorage.setItem('lanxess_historial_mediciones', JSON.stringify(historial))
    }
  }, [historial])
  
  // ═══════════════════════════════════════════════════════════════════════
  // COMPONENTES DE UI
  // ═══════════════════════════════════════════════════════════════════════
  
  const riesgoActual = getNivelRiesgo(decibeles)
  
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        padding: '20px',
        paddingTop: '80px' // Espacio para la navegación
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: HEADER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            marginBottom: '40px'
          }}
        >
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '10px'
            }}
          >
            📱 Medidor de Decibeles
          </h1>
          <p style={{ color: '#888', fontSize: '16px' }}>
            Herramienta diaria para proteger tu audición
          </p>
        </motion.div>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: MEDIDOR PRINCIPAL */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: '30px',
            padding: '50px 30px',
            marginBottom: '30px',
            border: `3px solid ${midiendo ? riesgoActual.color : 'rgba(255,255,255,0.1)'}`,
            boxShadow: midiendo ? `0 0 50px ${riesgoActual.color}40` : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Visualización principal de decibeles */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <motion.div
              animate={{
                scale: alertaActiva ? [1, 1.05, 1] : 1,
                rotate: alertaActiva ? [0, -2, 2, -2, 0] : 0
              }}
              transition={{
                duration: 0.5,
                repeat: alertaActiva ? Infinity : 0
              }}
            >
              <div
                style={{
                  fontSize: '120px',
                  fontWeight: 'bold',
                  color: getColorDB(decibeles),
                  textShadow: `0 0 40px ${getColorDB(decibeles)}`,
                  lineHeight: 1,
                  fontFamily: 'monospace'
                }}
              >
                {decibeles}
              </div>
              <div
                style={{
                  fontSize: '32px',
                  color: '#888',
                  marginTop: '10px',
                  fontWeight: '600'
                }}
              >
                dB
              </div>
            </motion.div>
            
            {/* Badge de nivel de riesgo */}
            <motion.div
              animate={{
                scale: alertaActiva ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 0.8,
                repeat: alertaActiva ? Infinity : 0
              }}
              style={{
                display: 'inline-block',
                padding: '12px 30px',
                background: riesgoActual.color,
                borderRadius: '25px',
                marginTop: '25px',
                boxShadow: `0 10px 30px ${riesgoActual.color}40`
              }}
            >
              <span style={{ fontSize: '20px', marginRight: '10px' }}>
                {riesgoActual.emoji}
              </span>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'white'
                }}
              >
                {riesgoActual.nivel}
              </span>
            </motion.div>
          </div>
          
          {/* Barra visual de decibeles */}
          <div
            style={{
              width: '100%',
              height: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              overflow: 'hidden',
              marginBottom: '30px',
              position: 'relative'
            }}
          >
            <motion.div
              animate={{ width: `${(decibeles / 120) * 100}%` }}
              transition={{ duration: 0.2 }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${getColorDB(decibeles)}, ${getColorDB(decibeles)}dd)`,
                borderRadius: '15px',
                boxShadow: `0 0 20px ${getColorDB(decibeles)}`
              }}
            />
            
            {/* Marcadores de zona */}
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.3)' }} title="60 dB" />
            <div style={{ position: 'absolute', left: '70.8%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.5)' }} title="85 dB - Zona de riesgo" />
          </div>
          
          {/* Recomendación */}
          {midiendo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '20px',
                background: `${riesgoActual.color}15`,
                borderRadius: '15px',
                border: `2px solid ${riesgoActual.color}40`,
                marginBottom: '30px'
              }}
            >
              <p
                style={{
                  color: riesgoActual.color,
                  fontSize: '16px',
                  margin: 0,
                  fontWeight: '600',
                  textAlign: 'center',
                  lineHeight: 1.5
                }}
              >
                {getRecomendacion(decibeles)}
              </p>
            </motion.div>
          )}
          
          {/* Estadísticas en tiempo real */}
          {midiendo && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
              }}
            >
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  PROMEDIO
                </div>
                <div style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold' }}>
                  {decibelesPromedio} dB
                </div>
              </div>
              
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  MÁXIMO
                </div>
                <div style={{ color: '#F44336', fontSize: '28px', fontWeight: 'bold' }}>
                  {decibelesMaximo} dB
                </div>
              </div>
              
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  TIEMPO
                </div>
                <div style={{ color: '#2196F3', fontSize: '28px', fontWeight: 'bold' }}>
                  {formatearTiempo(tiempoMedicion)}
                </div>
              </div>
              
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '20px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                  SEGURO POR
                </div>
                <div style={{ color: '#FF9800', fontSize: '20px', fontWeight: 'bold' }}>
                  {getTiempoSeguro(decibeles)}
                </div>
              </div>
            </div>
          )}
          
          {/* Botones de control */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            {!midiendo ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={iniciarMedidor}
                style={{
                  flex: 1,
                  maxWidth: '300px',
                  padding: '20px 40px',
                  fontSize: '20px',
                  fontWeight: '700',
                  borderRadius: '15px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)'
                }}
              >
                🎤 INICIAR MEDICIÓN
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={detenerMedidor}
                  style={{
                    flex: 1,
                    padding: '20px 40px',
                    fontSize: '18px',
                    fontWeight: '700',
                    borderRadius: '15px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #F44336, #E91E63)',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px rgba(244, 67, 54, 0.4)'
                  }}
                >
                  ⏹️ DETENER
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={reiniciarMedicion}
                  style={{
                    padding: '20px 30px',
                    fontSize: '18px',
                    fontWeight: '700',
                    borderRadius: '15px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  🔄
                </motion.button>
              </>
            )}
          </div>
          
          {/* Mensaje de error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(244, 67, 54, 0.2)',
                borderRadius: '12px',
                border: '1px solid rgba(244, 67, 54, 0.5)',
                color: '#F44336',
                fontSize: '14px',
                textAlign: 'center'
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </motion.div>
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: TIPS Y CALIBRACIÓN */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mostrarTips && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(33, 150, 243, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '25px',
              marginBottom: '30px',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setMostrarTips(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                fontSize: '20px'
              }}
            >
              ✕
            </button>
            
            <h3 style={{ color: '#2196F3', marginBottom: '15px', fontSize: '20px' }}>
              💡 Tips para mejores mediciones
            </h3>
            
            <ul style={{ color: '#ccc', fontSize: '14px', lineHeight: 1.8, paddingLeft: '20px' }}>
              <li>Mantén el micrófono del dispositivo despejado</li>
              <li>No cubras ni toques el micrófono durante la medición</li>
              <li>Los valores son aproximados y pueden variar según tu dispositivo</li>
              <li>Para calibración precisa, compara con un decibelímetro profesional</li>
              <li>Usa el slider de calibración si los valores parecen incorrectos</li>
            </ul>
            
            {/* Slider de calibración */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ color: '#2196F3', fontSize: '14px', display: 'block', marginBottom: '10px' }}>
                🔧 Calibración: {calibracion > 0 ? '+' : ''}{calibracion} dB
              </label>
              <input
                type="range"
                min="-20"
                max="20"
                value={calibracion}
                onChange={(e) => setCalibracion(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#2196F3'
                }}
              />
            </div>
          </motion.div>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: HISTORIAL DE MEDICIONES */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {historial.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 style={{ color: 'white', marginBottom: '20px', fontSize: '24px' }}>
              📊 Historial de Mediciones
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#888', fontSize: '12px' }}>FECHA</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px' }}>DURACIÓN</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px' }}>PROMEDIO</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px' }}>MÁXIMO</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '12px' }}>RIESGO</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((medicion, index) => {
                    const riesgo = getNivelRiesgo(medicion.promedio)
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '15px', color: '#ccc', fontSize: '14px' }}>
                          {medicion.fecha}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#2196F3', fontSize: '14px' }}>
                          {formatearTiempo(medicion.duracion)}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#4CAF50', fontSize: '14px', fontWeight: '600' }}>
                          {medicion.promedio} dB
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center', color: '#F44336', fontSize: '14px', fontWeight: '600' }}>
                          {medicion.maximo} dB
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              background: `${riesgo.color}20`,
                              border: `1px solid ${riesgo.color}40`,
                              borderRadius: '8px',
                              color: riesgo.color,
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            {medicion.riesgo}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        
        {/* Botón para volver a la experiencia */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: 'center', marginTop: '40px' }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onVolverExperiencia}
            style={{
              padding: '15px 40px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '12px',
              border: '2px solid rgba(76, 175, 80, 0.3)',
              background: 'rgba(76, 175, 80, 0.1)',
              color: '#4CAF50',
              cursor: 'pointer'
            }}
          >
            🔄 Repetir Experiencia Inmersiva
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default MedidorReal
