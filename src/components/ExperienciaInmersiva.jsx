/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE: ExperienciaInmersiva
 * Descripción: Experiencia principal con sonidos de fábrica, modelo 3D de auriculares,
 *              y medidor de decibeles simulado que muestra el efecto de la protección
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, useGLTF, Text } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

const ExperienciaInmersiva = ({ onComplete, desbloquearLogro, actualizarExposicion }) => {
  // ═══════════════════════════════════════════════════════════════════════
  // ESTADOS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════
  
  const [faseActual, setFaseActual] = useState(0)
  const [decibeles, setDecibeles] = useState(45) // Nivel de ruido simulado
  const [auricularesPuestos, setAuricularesPuestos] = useState(false)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [volumen, setVolumen] = useState(0.7)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(true)
  const [progresoFase, setProgresoFase] = useState(0)
  const [tiempoExposicion, setTiempoExposicion] = useState(0)
  const [advertenciaActiva, setAdvertenciaActiva] = useState(false)
  
  // Referencias
  const audioRef = useRef(null)
  const tiempoInicioRef = useRef(Date.now())
  
  // ═══════════════════════════════════════════════════════════════════════
  // DEFINICIÓN DE FASES DE LA EXPERIENCIA
  // ═══════════════════════════════════════════════════════════════════════
  
  const fases = [
    {
      id: 0,
      nombre: 'Introducción',
      descripcion: 'Bienvenido a la experiencia inmersiva. Estás a punto de entrar en un ambiente de fábrica ruidoso.',
      instruccion: 'Presiona "Iniciar" para comenzar la simulación',
      duracion: 5000,
      decibelesObjetivo: 45,
      color: '#4CAF50'
    },
    {
      id: 1,
      nombre: 'Ambiente Silencioso',
      descripcion: 'Actualmente estás en un ambiente seguro. Los niveles de ruido son normales.',
      instruccion: 'Observa el medidor de decibeles en la parte superior',
      duracion: 8000,
      decibelesObjetivo: 50,
      color: '#2196F3'
    },
    {
      id: 2,
      nombre: 'Ruido Moderado',
      descripcion: 'El nivel de ruido está aumentando. Esto es similar a una calle transitada.',
      instruccion: 'Nota cómo el medidor empieza a subir',
      duracion: 8000,
      decibelesObjetivo: 70,
      color: '#FF9800'
    },
    {
      id: 3,
      nombre: 'Zona de Peligro - SIN protección',
      descripcion: '⚠️ PELIGRO: Estás expuesto a niveles de ruido DAÑINOS sin protección auditiva.',
      instruccion: 'Este nivel puede causar daño permanente en menos de 2 horas',
      duracion: 10000,
      decibelesObjetivo: 105,
      color: '#F44336',
      esPeligroso: true
    },
    {
      id: 4,
      nombre: 'Colocando Protección',
      descripcion: 'Es momento de proteger tu audición. Vamos a colocarnos los auriculares.',
      instruccion: 'Haz clic en "PONER AURICULARES" para protegerte',
      duracion: 8000,
      decibelesObjetivo: 105,
      color: '#9C27B0',
      requiereAccion: true
    },
    {
      id: 5,
      nombre: 'Protegido - CON auriculares',
      descripcion: '✅ ¡Excelente! Ahora estás protegido. Nota la diferencia en el medidor.',
      instruccion: 'El ruido se redujo significativamente gracias a la protección',
      duracion: 10000,
      decibelesObjetivo: 70,
      color: '#4CAF50',
      auricularesPuestos: true
    },
    {
      id: 6,
      nombre: 'Comparación Final',
      descripcion: 'Acabas de experimentar la diferencia entre estar protegido y desprotegido.',
      instruccion: 'Esta es la importancia de usar protección auditiva',
      duracion: 8000,
      decibelesObjetivo: 70,
      color: '#4CAF50',
      esUltimaFase: true
    }
  ]
  
  const faseActualData = fases[faseActual]
  
  // ═══════════════════════════════════════════════════════════════════════
  // EFECTOS Y LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Efecto: Cargar y configurar el audio de fábrica
   */
  useEffect(() => {
    // Crear elemento de audio
    const audio = new Audio('/Sonidos_De_Fabrica.wav') // TU ARCHIVO WAV
    audio.loop = true
    audio.volume = 0
    audioRef.current = audio
    
    console.log('🔊 Audio de fábrica cargado')
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])
  
  /**
   * Efecto: Simular cambio de decibeles según la fase
   */
  useEffect(() => {
    if (!reproduciendo) return
    
    const intervalo = setInterval(() => {
      const objetivo = faseActualData.decibelesObjetivo
      
      setDecibeles(prev => {
        // Suavizar el cambio de decibeles con interpolación
        const diferencia = objetivo - prev
        const cambio = diferencia * 0.1 // 10% de la diferencia cada frame
        
        // Agregar un poco de variación aleatoria para realismo
        const variacion = (Math.random() - 0.5) * 2
        
        return prev + cambio + variacion
      })
    }, 100)
    
    return () => clearInterval(intervalo)
  }, [reproduciendo, faseActualData.decibelesObjetivo])
  
  /**
   * Efecto: Controlar el volumen del audio según los decibeles
   */
  useEffect(() => {
    if (audioRef.current) {
      // Mapear decibeles (0-120) a volumen (0-1)
      let volumenCalculado = (decibeles - 40) / 80 // De 40dB a 120dB
      volumenCalculado = Math.max(0, Math.min(1, volumenCalculado))
      
      // Si tiene auriculares puestos, reducir el volumen drásticamente
      if (auricularesPuestos) {
        volumenCalculado *= 0.3 // Reducción del 70%
      }
      
      audioRef.current.volume = volumenCalculado
    }
  }, [decibeles, auricularesPuestos])
  
  /**
   * Efecto: Avanzar automáticamente entre fases
   */
  useEffect(() => {
    if (!reproduciendo || faseActualData.requiereAccion) return
    
    const duracion = faseActualData.duracion
    let progreso = 0
    
    const intervalo = setInterval(() => {
      progreso += 100
      const porcentaje = (progreso / duracion) * 100
      setProgresoFase(porcentaje)
      
      if (progreso >= duracion) {
        clearInterval(intervalo)
        siguienteFase()
      }
    }, 100)
    
    return () => clearInterval(intervalo)
  }, [faseActual, reproduciendo])
  
  /**
   * Efecto: Controlar tiempo de exposición y advertencias
   */
  useEffect(() => {
    if (!reproduciendo) return
    
    const intervalo = setInterval(() => {
      setTiempoExposicion(prev => prev + 1)
      
      // Si está en zona de peligro sin protección, activar advertencia
      if (faseActualData.esPeligroso && !auricularesPuestos) {
        setAdvertenciaActiva(true)
        
        // Registrar exposición peligrosa
        actualizarExposicion('peligro', 1/60) // 1 segundo en minutos
      } else if (decibeles > 85 && !auricularesPuestos) {
        actualizarExposicion('riesgo', 1/60)
      } else {
        setAdvertenciaActiva(false)
        actualizarExposicion('seguras', 1/60)
      }
    }, 1000)
    
    return () => clearInterval(intervalo)
  }, [reproduciendo, faseActualData, auricularesPuestos, decibeles])
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES DE CONTROL
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Iniciar la experiencia
   */
  const iniciarExperiencia = () => {
    console.log('🎬 Iniciando experiencia inmersiva')
    setReproduciendo(true)
    setMostrarInstrucciones(false)
    
    // Reproducir audio
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.error('Error al reproducir audio:', err)
        alert('Por favor activa el sonido para una mejor experiencia')
      })
    }
    
    desbloquearLogro('experiencia_iniciada')
  }
  
  /**
   * Avanzar a la siguiente fase
   */
  const siguienteFase = () => {
    if (faseActual < fases.length - 1) {
      console.log(`➡️ Avanzando a fase ${faseActual + 2}`)
      setFaseActual(faseActual + 1)
      setProgresoFase(0)
      
      // Desbloquear logros por fase
      if (faseActual + 1 === 3) desbloquearLogro('zona_peligro_experimentada')
      if (faseActual + 1 === 5) desbloquearLogro('proteccion_usada')
    } else {
      completarExperiencia()
    }
  }
  
  /**
   * Poner/quitar auriculares
   */
  const toggleAuriculares = () => {
    setAuricularesPuestos(!auricularesPuestos)
    console.log(`🎧 Auriculares ${!auricularesPuestos ? 'puestos' : 'quitados'}`)
    
    if (!auricularesPuestos) {
      desbloquearLogro('auriculares_colocados')
      
      // Si estamos en la fase que requiere acción, avanzar
      if (faseActualData.requiereAccion) {
        setTimeout(() => {
          siguienteFase()
        }, 2000)
      }
    }
  }
  
  /**
   * Completar la experiencia
   */
  const completarExperiencia = () => {
    console.log('✅ Experiencia completada')
    
    // Detener audio
    if (audioRef.current) {
      audioRef.current.pause()
    }
    
    setReproduciendo(false)
    desbloquearLogro('experiencia_completada')
    
    // Callback para avanzar a la siguiente pantalla
    setTimeout(() => {
      onComplete()
    }, 2000)
  }
  
  /**
   * Saltar la experiencia (emergencia)
   */
  const saltarExperiencia = () => {
    if (window.confirm('¿Seguro que quieres saltar la experiencia? Perderás el aprendizaje inmersivo.')) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      onComplete()
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES HELPER
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Obtener color según nivel de decibeles
   */
  const getColorDecibeles = (db) => {
    if (db < 60) return '#4CAF50' // Verde - Seguro
    if (db < 85) return '#2196F3' // Azul - Normal
    if (db < 95) return '#FF9800' // Naranja - Cuidado
    return '#F44336' // Rojo - Peligro
  }
  
  /**
   * Obtener mensaje según nivel de decibeles
   */
  const getMensajeDecibeles = (db) => {
    if (db < 60) return '✅ Nivel seguro'
    if (db < 85) return 'ℹ️ Nivel normal'
    if (db < 95) return '⚠️ Use protección si está expuesto por más de 4 horas'
    return '🚨 PELIGRO - Use protección INMEDIATAMENTE'
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
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MEDIDOR DE DECIBELES - SIEMPRE VISIBLE */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '20px 40px',
          border: `2px solid ${getColorDecibeles(decibeles)}`,
          boxShadow: `0 0 30px ${getColorDecibeles(decibeles)}`,
          minWidth: '300px'
        }}
      >
        {/* Número de decibeles grande */}
        <div style={{ textAlign: 'center' }}>
          <motion.div
            animate={{ 
              scale: advertenciaActiva ? [1, 1.1, 1] : 1,
              color: getColorDecibeles(decibeles)
            }}
            transition={{ duration: 0.5, repeat: advertenciaActiva ? Infinity : 0 }}
            style={{
              fontSize: '60px',
              fontWeight: 'bold',
              color: getColorDecibeles(decibeles),
              textShadow: `0 0 20px ${getColorDecibeles(decibeles)}`,
              lineHeight: 1
            }}
          >
            {Math.round(decibeles)}
          </motion.div>
          
          <div style={{ fontSize: '20px', color: '#888', marginTop: '5px' }}>
            dB
          </div>
        </div>
        
        {/* Barra visual de decibeles */}
        <div
          style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            marginTop: '15px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <motion.div
            animate={{ width: `${(decibeles / 120) * 100}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              background: `linear-gradient(90deg, ${getColorDecibeles(decibeles)}, ${getColorDecibeles(decibeles)}dd)`,
              borderRadius: '10px',
              boxShadow: `0 0 15px ${getColorDecibeles(decibeles)}`
            }}
          />
          
          {/* Marcadores de zonas */}
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.3)' }} />
          <div style={{ position: 'absolute', left: '80%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.3)' }} />
        </div>
        
        {/* Mensaje descriptivo */}
        <div
          style={{
            marginTop: '10px',
            fontSize: '12px',
            color: getColorDecibeles(decibeles),
            textAlign: 'center',
            fontWeight: '600'
          }}
        >
          {getMensajeDecibeles(decibeles)}
        </div>
        
        {/* Indicador de protección */}
        {auricularesPuestos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginTop: '10px',
              padding: '8px 15px',
              background: 'rgba(76, 175, 80, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(76, 175, 80, 0.5)',
              textAlign: 'center',
              color: '#4CAF50',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🎧 Protección Activa (-70% ruido)
          </motion.div>
        )}
      </motion.div>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ESCENA 3D CON MODELO DE AURICULARES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ width: '100%', height: '50vh', position: 'relative' }}>
        <Canvas>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              minDistance={3}
              maxDistance={10}
            />
            
            {/* Iluminación */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4CAF50" />
            
            {/* Modelo 3D de auriculares */}
            <ModeloAuriculares 
              auricularesPuestos={auricularesPuestos}
              decibeles={decibeles}
            />
            
            {/* Ambiente */}
            <Environment preset="night" />
            
            {/* Partículas de sonido */}
            {reproduciendo && <ParticulasSonido intensidad={decibeles} />}
          </Suspense>
        </Canvas>
        
        {/* Overlay de instrucción para rotar */}
        {reproduciendo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '14px',
              background: 'rgba(0,0,0,0.6)',
              padding: '10px 20px',
              borderRadius: '10px'
            }}
          >
            👆 Arrastra para rotar el modelo 3D
          </motion.div>
        )}
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PANEL DE INFORMACIÓN Y CONTROLES */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          padding: '40px 20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}
      >
        {/* Pantalla de instrucciones inicial */}
        {mostrarInstrucciones && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏭</div>
            <h2 style={{ color: 'white', fontSize: '32px', marginBottom: '15px' }}>
              Experiencia Inmersiva de Protección Auditiva
            </h2>
            <p style={{ color: '#ccc', fontSize: '16px', marginBottom: '30px', lineHeight: 1.6 }}>
              Estás a punto de experimentar un ambiente de fábrica realista con diferentes niveles de ruido.
              Aprenderás la importancia de la protección auditiva de manera práctica e inmersiva.
            </p>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ color: '#4CAF50', marginBottom: '10px', fontSize: '14px' }}>
                💡 RECOMENDACIONES:
              </div>
              <div style={{ color: '#888', fontSize: '14px', lineHeight: 1.8 }}>
                • Usa audífonos para mejor experiencia<br/>
                • Encuentra un lugar tranquilo<br/>
                • La experiencia dura aproximadamente 3-4 minutos<br/>
                • Puedes pausar en cualquier momento
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px #4CAF50' }}
              whileTap={{ scale: 0.95 }}
              onClick={iniciarExperiencia}
              style={{
                padding: '18px 50px',
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
              🎬 INICIAR EXPERIENCIA
            </motion.button>
          </motion.div>
        )}
        
        {/* Panel de fase actual (cuando está reproduciendo) */}
        {reproduciendo && (
          <AnimatePresence mode="wait">
            <motion.div
              key={faseActual}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '30px',
                border: `2px solid ${faseActualData.color}`,
                boxShadow: `0 0 30px ${faseActualData.color}40`
              }}
            >
              {/* Número de fase */}
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 20px',
                  background: faseActualData.color,
                  borderRadius: '20px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '20px'
                }}
              >
                Fase {faseActual + 1} de {fases.length}
              </div>
              
              {/* Título de la fase */}
              <h3
                style={{
                  color: 'white',
                  fontSize: '28px',
                  marginBottom: '15px',
                  textShadow: `0 0 20px ${faseActualData.color}`
                }}
              >
                {faseActualData.nombre}
              </h3>
              
              {/* Descripción */}
              <p style={{ color: '#ccc', fontSize: '16px', marginBottom: '15px', lineHeight: 1.6 }}>
                {faseActualData.descripcion}
              </p>
              
              {/* Instrucción */}
              <div
                style={{
                  padding: '15px 20px',
                  background: `${faseActualData.color}20`,
                  borderRadius: '10px',
                  border: `1px solid ${faseActualData.color}40`,
                  marginBottom: '25px'
                }}
              >
                <p style={{ color: faseActualData.color, fontSize: '14px', fontWeight: '600', margin: 0 }}>
                  ℹ️ {faseActualData.instruccion}
                </p>
              </div>
              
              {/* Barra de progreso de fase */}
              {!faseActualData.requiereAccion && (
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '20px'
                  }}
                >
                  <motion.div
                    animate={{ width: `${progresoFase}%` }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: '100%',
                      background: faseActualData.color,
                      borderRadius: '10px',
                      boxShadow: `0 0 10px ${faseActualData.color}`
                    }}
                  />
                </div>
              )}
              
              {/* Botón de acción (si la fase lo requiere) */}
              {faseActualData.requiereAccion && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleAuriculares}
                  disabled={auricularesPuestos}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '20px',
                    fontWeight: '700',
                    borderRadius: '12px',
                    border: 'none',
                    background: auricularesPuestos 
                      ? 'linear-gradient(135deg, #4CAF50, #8BC34A)'
                      : 'linear-gradient(135deg, #9C27B0, #BA68C8)',
                    color: 'white',
                    cursor: auricularesPuestos ? 'not-allowed' : 'pointer',
                    boxShadow: auricularesPuestos 
                      ? '0 10px 30px rgba(76, 175, 80, 0.4)'
                      : '0 10px 30px rgba(156, 39, 176, 0.4)',
                    marginBottom: '15px'
                  }}
                >
                  {auricularesPuestos ? '✅ Protección Activada' : '🎧 PONER AURICULARES'}
                </motion.button>
              )}
              
              {/* Información adicional */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  ⏱️ Tiempo: {formatearTiempo(tiempoExposicion)}
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  🎯 Progreso: {Math.round(((faseActual + 1) / fases.length) * 100)}%
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Advertencia de peligro flotante */}
        {advertenciaActiva && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: [1, 1.05, 1]
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ scale: { duration: 1, repeat: Infinity } }}
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '20px 40px',
              background: 'rgba(244, 67, 54, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              color: 'white',
              fontSize: '18px',
              fontWeight: '700',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(244, 67, 54, 0.6)',
              zIndex: 1000,
              maxWidth: '90%'
            }}
          >
            🚨 ADVERTENCIA: Nivel de ruido PELIGROSO<br/>
            <span style={{ fontSize: '14px', fontWeight: '400' }}>
              Use protección auditiva inmediatamente
            </span>
          </motion.div>
        )}
      </div>
      
      {/* Botón de saltar (esquina) */}
      {import.meta.env.DEV && reproduciendo && (
        <motion.button
          whileHover={{ opacity: 1 }}
          onClick={saltarExperiencia}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 15px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            opacity: 0.5,
            zIndex: 999
          }}
        >
          Saltar (DEV)
        </motion.button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE 3D: Modelo de Auriculares
// ═══════════════════════════════════════════════════════════════════════════
const ModeloAuriculares = ({ auricularesPuestos, decibeles }) => {
  const modeloRef = useRef()
  
  // Cargar el modelo 3D (TU ARCHIVO .glb)
  const { scene } = useGLTF('/microsoft_headphones_surface_2-v1.glb')
  
  // Animación de rotación automática
  useFrame((state, delta) => {
    if (modeloRef.current) {
      modeloRef.current.rotation.y += delta * 0.3
      
      // Si los auriculares están puestos, hacer un efecto de "brillo"
      if (auricularesPuestos) {
        modeloRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
      }
    }
  })
  
  return (
    <group ref={modeloRef} position={[0, 0, 0]}>
      <primitive 
        object={scene} 
        scale={auricularesPuestos ? 1.2 : 1}
      />
      
      {/* Halo de luz cuando están puestos */}
      {auricularesPuestos && (
        <pointLight 
          position={[0, 0, 0]} 
          intensity={2} 
          color="#4CAF50"
          distance={5}
        />
      )}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE 3D: Partículas de Sonido
// ═══════════════════════════════════════════════════════════════════════════
const ParticulasSonido = ({ intensidad }) => {
  const particulas = useRef()
  
  const cantidadParticulas = Math.floor((intensidad / 120) * 100)
  
  useFrame((state) => {
    if (particulas.current) {
      particulas.current.rotation.y += 0.001 * (intensidad / 60)
    }
  })
  
  return (
    <group ref={particulas}>
      {[...Array(cantidadParticulas)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5
          ]}
        >
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial 
            color={intensidad > 90 ? '#F44336' : intensidad > 70 ? '#FF9800' : '#4CAF50'}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

export default ExperienciaInmersiva
