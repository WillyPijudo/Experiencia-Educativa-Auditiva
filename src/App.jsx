/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LANXESS - PROTECCIÓN AUDITIVA PWA
 * Archivo: App.jsx (COMPONENTE PRINCIPAL)
 * Descripción: Componente raíz que maneja toda la navegación y estado global
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FLUJO DE LA APLICACIÓN:
 * 1. Pantalla de Bienvenida (SplashScreen)
 * 2. Onboarding/Tutorial
 * 3. Experiencia Inmersiva (Simulación con sonidos y 3D)
 * 4. Mensaje Educativo Final
 * 5. Medidor de Decibeles Real (Herramienta diaria)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './App.css'

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTAR COMPONENTES (Los crearemos después)
// ═══════════════════════════════════════════════════════════════════════════
import SplashScreen from './components/SplashScreen'
import Onboarding from './components/Onboarding'
import ExperienciaInmersiva from './components/ExperienciaInmersiva'
import MensajeFinal from './components/MensajeFinal'
import MedidorReal from './components/MedidorReal'
import Navegacion from './components/Navegacion'
import InstallPrompt from './components/InstallPrompt'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES Y CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const PANTALLAS = {
  SPLASH: 'splash',
  ONBOARDING: 'onboarding',
  EXPERIENCIA: 'experiencia',
  MENSAJE_FINAL: 'mensaje_final',
  MEDIDOR_REAL: 'medidor_real'
}

const DURACION_SPLASH = 3000 // 3 segundos

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL APP
// ═══════════════════════════════════════════════════════════════════════════

function App() {
  // ═══════════════════════════════════════════════════════════════════════
  // ESTADOS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════
  
  const [pantallaActual, setPantallaActual] = useState(PANTALLAS.SPLASH)
  const [progresoTotal, setProgresoTotal] = useState(0)
  const [experienciaCompletada, setExperienciaCompletada] = useState(false)
  const [usuarioData, setUsuarioData] = useState({
    nombre: '',
    visitasApp: 0,
    logrosDesbloqueados: [],
    horasExposicion: {
      seguras: 0,
      riesgo: 0,
      peligro: 0
    }
  })
  
  // ═══════════════════════════════════════════════════════════════════════
  // EFECTOS Y LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Efecto: Cargar datos del usuario desde localStorage al iniciar
   */
  useEffect(() => {
    cargarDatosUsuario()
    verificarPrimeraVisita()
  }, [])
  
  /**
   * Efecto: Manejar el splash screen automático
   */
  useEffect(() => {
    if (pantallaActual === PANTALLAS.SPLASH) {
      const timer = setTimeout(() => {
        // Si es primera visita, ir a onboarding
        // Si no, ir directo a experiencia o medidor
        const esPrimeraVisita = !localStorage.getItem('lanxess_visited')
        
        if (esPrimeraVisita) {
          setPantallaActual(PANTALLAS.ONBOARDING)
        } else {
          setPantallaActual(PANTALLAS.MEDIDOR_REAL)
        }
      }, DURACION_SPLASH)
      
      return () => clearTimeout(timer)
    }
  }, [pantallaActual])
  
  /**
   * Efecto: Guardar progreso del usuario periódicamente
   */
  useEffect(() => {
    const intervalo = setInterval(() => {
      guardarDatosUsuario()
    }, 30000) // Cada 30 segundos
    
    return () => clearInterval(intervalo)
  }, [usuarioData])
  
  /**
   * Efecto: Detectar cuando el usuario regresa a la app (para PWA)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 Usuario regresó a la app')
        actualizarContadorVisitas()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES DE GESTIÓN DE DATOS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Cargar datos del usuario desde localStorage
   */
  const cargarDatosUsuario = () => {
    try {
      const datosGuardados = localStorage.getItem('lanxess_user_data')
      
      if (datosGuardados) {
        const datos = JSON.parse(datosGuardados)
        setUsuarioData(datos)
        console.log('✅ Datos del usuario cargados:', datos)
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error)
    }
  }
  
  /**
   * Guardar datos del usuario en localStorage
   */
  const guardarDatosUsuario = () => {
    try {
      localStorage.setItem('lanxess_user_data', JSON.stringify(usuarioData))
      console.log('💾 Datos del usuario guardados')
    } catch (error) {
      console.error('❌ Error al guardar datos del usuario:', error)
    }
  }
  
  /**
   * Verificar si es la primera visita del usuario
   */
  const verificarPrimeraVisita = () => {
    const yaVisito = localStorage.getItem('lanxess_visited')
    
    if (!yaVisito) {
      localStorage.setItem('lanxess_visited', 'true')
      console.log('🎉 Primera visita del usuario')
    }
  }
  
  /**
   * Actualizar contador de visitas
   */
  const actualizarContadorVisitas = () => {
    setUsuarioData(prev => ({
      ...prev,
      visitasApp: prev.visitasApp + 1
    }))
  }
  
  /**
   * Desbloquear un logro
   */
  const desbloquearLogro = (logroId) => {
    setUsuarioData(prev => {
      if (!prev.logrosDesbloqueados.includes(logroId)) {
        return {
          ...prev,
          logrosDesbloqueados: [...prev.logrosDesbloqueados, logroId]
        }
      }
      return prev
    })
  }
  
  /**
   * Actualizar tiempo de exposición
   */
  const actualizarExposicion = (tipo, minutos) => {
    setUsuarioData(prev => ({
      ...prev,
      horasExposicion: {
        ...prev.horasExposicion,
        [tipo]: prev.horasExposicion[tipo] + minutos
      }
    }))
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES DE NAVEGACIÓN
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Navegar a una pantalla específica
   */
  const irAPantalla = (pantalla) => {
    console.log(`🧭 Navegando a: ${pantalla}`)
    setPantallaActual(pantalla)
    
    // Scroll al top cuando cambia de pantalla
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Guardar progreso
    guardarDatosUsuario()
  }
  
  /**
   * Completar el onboarding e ir a la experiencia
   */
  const completarOnboarding = () => {
    console.log('✅ Onboarding completado')
    desbloquearLogro('onboarding_complete')
    irAPantalla(PANTALLAS.EXPERIENCIA)
  }
  
  /**
   * Completar la experiencia inmersiva
   */
  const completarExperiencia = () => {
    console.log('✅ Experiencia inmersiva completada')
    setExperienciaCompletada(true)
    desbloquearLogro('experiencia_complete')
    setProgresoTotal(50)
    irAPantalla(PANTALLAS.MENSAJE_FINAL)
  }
  
  /**
   * Ir al medidor real desde el mensaje final
   */
  const irAMedidorReal = () => {
    console.log('📱 Ir al medidor real')
    desbloquearLogro('medidor_accessed')
    setProgresoTotal(100)
    irAPantalla(PANTALLAS.MEDIDOR_REAL)
  }
  
  /**
   * Repetir la experiencia inmersiva
   */
  const repetirExperiencia = () => {
    console.log('🔄 Repitiendo experiencia')
    irAPantalla(PANTALLAS.EXPERIENCIA)
  }
  
  /**
   * Reiniciar toda la aplicación (útil para demos)
   */
  const reiniciarApp = () => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar la aplicación? Se perderán todos tus datos.')) {
      localStorage.clear()
      window.location.reload()
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // FUNCIONES DE ANÁLISIS Y ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Obtener estadísticas del usuario
   */
  const obtenerEstadisticas = () => {
    const totalHoras = Object.values(usuarioData.horasExposicion).reduce((a, b) => a + b, 0)
    const porcentajeSeguro = totalHoras > 0 
      ? (usuarioData.horasExposicion.seguras / totalHoras * 100).toFixed(1)
      : 0
    
    return {
      totalHoras,
      porcentajeSeguro,
      logrosTotal: usuarioData.logrosDesbloqueados.length,
      visitas: usuarioData.visitasApp
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER CONDICIONAL BASADO EN PANTALLA ACTUAL
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Función para renderizar la pantalla actual
   */
  const renderizarPantalla = () => {
    switch (pantallaActual) {
      case PANTALLAS.SPLASH:
        return <SplashScreen />
      
      case PANTALLAS.ONBOARDING:
        return (
          <Onboarding 
            onComplete={completarOnboarding}
            usuarioData={usuarioData}
            setUsuarioData={setUsuarioData}
          />
        )
      
      case PANTALLAS.EXPERIENCIA:
        return (
          <ExperienciaInmersiva 
            onComplete={completarExperiencia}
            desbloquearLogro={desbloquearLogro}
            actualizarExposicion={actualizarExposicion}
          />
        )
      
      case PANTALLAS.MENSAJE_FINAL:
        return (
          <MensajeFinal 
            onContinuar={irAMedidorReal}
            onRepetir={repetirExperiencia}
            estadisticas={obtenerEstadisticas()}
          />
        )
      
      case PANTALLAS.MEDIDOR_REAL:
        return (
          <MedidorReal 
            usuarioData={usuarioData}
            actualizarExposicion={actualizarExposicion}
            desbloquearLogro={desbloquearLogro}
            onVolverExperiencia={repetirExperiencia}
          />
        )
      
      default:
        return <SplashScreen />
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════
  
  return (
    <div className="app-container">
      {/* Navegación superior (solo visible después del onboarding) */}
      {pantallaActual !== PANTALLAS.SPLASH && pantallaActual !== PANTALLAS.ONBOARDING && (
        <Navegacion 
          pantallaActual={pantallaActual}
          irAPantalla={irAPantalla}
          progresoTotal={progresoTotal}
          estadisticas={obtenerEstadisticas()}
        />
      )}
      
      {/* Contenedor principal con animaciones de transición */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pantallaActual}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="pantalla-contenedor"
        >
          {renderizarPantalla()}
        </motion.div>
      </AnimatePresence>
      
      {/* Prompt de instalación PWA (solo aparece cuando es posible instalar) */}
      <InstallPrompt />
      
      {/* Botón de reinicio (solo en desarrollo) */}
      {import.meta.env.DEV && (
        <button 
          onClick={reiniciarApp}
          className="dev-reset-button"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '10px 15px',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 9999,
            fontSize: '12px'
          }}
        >
          🔄 Reiniciar App (DEV)
        </button>
      )}
    </div>
  )
}

export default App
