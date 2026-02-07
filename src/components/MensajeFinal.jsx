/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENTE: MensajeFinal
 * Descripción: Mensaje educativo final sobre protección auditiva en la vida diaria
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { motion } from 'framer-motion'
import { useState } from 'react'
import Confetti from 'react-confetti'

const MensajeFinal = ({ onContinuar, onRepetir, estadisticas }) => {
  const [mostrarConfetti, setMostrarConfetti] = useState(true)
  
  // Datos de situaciones cotidianas con niveles de decibeles
  const situacionesCotidianas = [
    {
      icono: '🚗',
      situacion: 'Tráfico pesado',
      decibeles: 85,
      tiempo: '8 horas',
      riesgo: 'medio',
      consejo: 'Usa tapones en viajes largos o commute diario'
    },
    {
      icono: '🎵',
      situacion: 'Conciertos y eventos',
      decibeles: 110,
      tiempo: '15 minutos',
      riesgo: 'alto',
      consejo: 'SIEMPRE lleva protección auditiva a conciertos'
    },
    {
      icono: '🏗️',
      situacion: 'Herramientas eléctricas',
      decibeles: 100,
      tiempo: '2 horas',
      riesgo: 'alto',
      consejo: 'Usa protección siempre que uses herramientas de poder'
    },
    {
      icono: '🎮',
      situacion: 'Audífonos a volumen alto',
      decibeles: 95,
      tiempo: '4 horas',
      riesgo: 'medio',
      consejo: 'Regla 60-60: máximo 60% volumen, 60 minutos'
    },
    {
      icono: '🚁',
      situacion: 'Avión despegando',
      decibeles: 120,
      tiempo: 'Inmediato',
      riesgo: 'crítico',
      consejo: 'Protección obligatoria en aeropuertos y cerca de aviones'
    },
    {
      icono: '🏍️',
      situacion: 'Motocicleta',
      decibeles: 90,
      tiempo: '4 horas',
      riesgo: 'medio',
      consejo: 'Usa tapones especiales para motociclistas'
    }
  ]
  
  const getColorRiesgo = (riesgo) => {
    switch(riesgo) {
      case 'bajo': return '#4CAF50'
      case 'medio': return '#FF9800'
      case 'alto': return '#F44336'
      case 'crítico': return '#9C27B0'
      default: return '#2196F3'
    }
  }
  
  const getLabelRiesgo = (riesgo) => {
    switch(riesgo) {
      case 'bajo': return 'RIESGO BAJO'
      case 'medio': return 'RIESGO MEDIO'
      case 'alto': return 'RIESGO ALTO'
      case 'crítico': return 'RIESGO CRÍTICO'
      default: return 'NORMAL'
    }
  }
  
  setTimeout(() => setMostrarConfetti(false), 5000)
  
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '40px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Confetti de celebración */}
      {mostrarConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
        />
      )}
      
      {/* Contenedor principal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: '1000px',
          margin: '0 auto'
        }}
      >
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: FELICITACIONES */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            textAlign: 'center',
            marginBottom: '50px'
          }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            style={{ fontSize: '100px', marginBottom: '20px' }}
          >
            🎉
          </motion.div>
          
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '15px',
              textShadow: '0 0 30px rgba(76, 175, 80, 0.5)'
            }}
          >
            ¡Felicitaciones!
          </h1>
          
          <p style={{ fontSize: '20px', color: '#4CAF50', marginBottom: '10px' }}>
            Has completado la experiencia inmersiva
          </p>
          
          <p style={{ fontSize: '16px', color: '#888', lineHeight: 1.6 }}>
            Ahora conoces la diferencia que hace la protección auditiva.<br/>
            Pero esto es solo el comienzo...
          </p>
        </motion.div>
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: MENSAJE EDUCATIVO PRINCIPAL */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '40px',
            border: '2px solid #4CAF50',
            boxShadow: '0 0 40px rgba(76, 175, 80, 0.2)'
          }}
        >
          <div style={{ fontSize: '50px', marginBottom: '20px', textAlign: 'center' }}>
            💡
          </div>
          
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '20px',
              textAlign: 'center'
            }}
          >
            La Protección No Es Solo Para El Trabajo
          </h2>
          
          <div
            style={{
              fontSize: '18px',
              color: '#cccccc',
              lineHeight: 1.8,
              marginBottom: '30px'
            }}
          >
            <p style={{ marginBottom: '15px' }}>
              <strong style={{ color: 'white' }}>¿Sabías que...?</strong>
            </p>
            
            <ul style={{ paddingLeft: '20px', listStyle: 'none' }}>
              <li style={{ marginBottom: '12px' }}>
                ⚠️ El <strong style={{ color: '#FF9800' }}>daño auditivo es PERMANENTE</strong> y no se puede revertir
              </li>
              <li style={{ marginBottom: '12px' }}>
                📊 Más del <strong style={{ color: '#4CAF50' }}>60% del daño auditivo</strong> ocurre fuera del trabajo
              </li>
              <li style={{ marginBottom: '12px' }}>
                🎧 Escuchar música a <strong style={{ color: '#F44336' }}>volumen alto</strong> causa el mismo daño que una fábrica
              </li>
              <li style={{ marginBottom: '12px' }}>
                ⏰ La exposición a <strong style={{ color: '#FF9800' }}>85 dB por 8 horas</strong> puede causar daño permanente
              </li>
              <li style={{ marginBottom: '12px' }}>
                👂 Una vez dañadas, las células ciliadas del oído <strong style={{ color: '#F44336' }}>NO SE REGENERAN</strong>
              </li>
            </ul>
          </div>
          
          <div
            style={{
              padding: '20px',
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              marginTop: '25px'
            }}
          >
            <p
              style={{
                color: '#4CAF50',
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.6
              }}
            >
              💚 Tu audición es un TESORO que debes cuidar TODOS LOS DÍAS,<br/>
              no solo en el trabajo.
            </p>
          </div>
        </motion.div>
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: SITUACIONES COTIDIANAS */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginBottom: '40px' }}
        >
          <h2
            style={{
              fontSize: '28px',
              color: 'white',
              marginBottom: '25px',
              textAlign: 'center'
            }}
          >
            🌍 Situaciones Cotidianas de Riesgo
          </h2>
          
          <p
            style={{
              fontSize: '16px',
              color: '#888',
              textAlign: 'center',
              marginBottom: '30px'
            }}
          >
            Conoce los niveles de ruido en tu día a día y cuándo debes protegerte
          </p>
          
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}
          >
            {situacionesCotidianas.map((situacion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${getColorRiesgo(situacion.riesgo)}` }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: `2px solid ${getColorRiesgo(situacion.riesgo)}30`,
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Ícono y nivel de riesgo */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}
                >
                  <div style={{ fontSize: '40px' }}>{situacion.icono}</div>
                  <div
                    style={{
                      padding: '5px 12px',
                      background: getColorRiesgo(situacion.riesgo),
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: 'white'
                    }}
                  >
                    {getLabelRiesgo(situacion.riesgo)}
                  </div>
                </div>
                
                {/* Situación */}
                <h3
                  style={{
                    fontSize: '18px',
                    color: 'white',
                    marginBottom: '10px',
                    fontWeight: '600'
                  }}
                >
                  {situacion.situacion}
                </h3>
                
                {/* Decibeles */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}
                >
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: getColorRiesgo(situacion.riesgo),
                      marginRight: '8px'
                    }}
                  >
                    {situacion.decibeles}
                  </div>
                  <div style={{ color: '#888', fontSize: '14px' }}>
                    dB
                  </div>
                </div>
                
                {/* Tiempo de exposición segura */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#888',
                    marginBottom: '12px'
                  }}
                >
                  ⏱️ Exposición segura: <strong style={{ color: '#ccc' }}>{situacion.tiempo}</strong>
                </div>
                
                {/* Consejo */}
                <div
                  style={{
                    padding: '12px',
                    background: `${getColorRiesgo(situacion.riesgo)}15`,
                    borderRadius: '8px',
                    border: `1px solid ${getColorRiesgo(situacion.riesgo)}30`,
                    fontSize: '13px',
                    color: '#ccc',
                    lineHeight: 1.4
                  }}
                >
                  💡 {situacion.consejo}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: ESTADÍSTICAS DEL USUARIO */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {estadisticas && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '40px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3
              style={{
                fontSize: '24px',
                color: 'white',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              📊 Tu Progreso
            </h3>
            
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '20px'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', color: '#4CAF50', fontWeight: 'bold' }}>
                  {estadisticas.logrosTotal}
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>Logros</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', color: '#2196F3', fontWeight: 'bold' }}>
                  {estadisticas.visitas}
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>Visitas</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', color: '#FF9800', fontWeight: 'bold' }}>
                  {estadisticas.porcentajeSeguro}%
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>Tiempo Seguro</div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* SECCIÓN: LLAMADA A LA ACCIÓN */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          style={{
            background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '30px',
            boxShadow: '0 10px 40px rgba(76, 175, 80, 0.3)'
          }}
        >
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '15px'
            }}
          >
            🚀 ¡Ahora es tu turno!
          </h2>
          
          <p style={{ fontSize: '18px', color: 'white', marginBottom: '30px', opacity: 0.9 }}>
            Usa nuestra herramienta de medición de decibeles para<br/>
            monitorear el ruido en tu día a día y proteger tu audición
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinuar}
            style={{
              padding: '18px 50px',
              fontSize: '20px',
              fontWeight: '700',
              borderRadius: '12px',
              border: 'none',
              background: 'white',
              color: '#4CAF50',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              marginRight: '15px',
              marginBottom: '15px'
            }}
          >
            📱 IR AL MEDIDOR →
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRepetir}
            style={{
              padding: '18px 50px',
              fontSize: '20px',
              fontWeight: '700',
              borderRadius: '12px',
              border: '2px solid white',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            🔄 Repetir Experiencia
          </motion.button>
        </motion.div>
        
        {/* Mensaje final motivacional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{
            textAlign: 'center',
            color: '#888',
            fontSize: '14px',
            lineHeight: 1.6
          }}
        >
          <p>
            Recuerda: <strong style={{ color: '#4CAF50' }}>La prevención es la clave</strong>.<br/>
            Una vez dañada, tu audición no vuelve atrás.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default MensajeFinal
