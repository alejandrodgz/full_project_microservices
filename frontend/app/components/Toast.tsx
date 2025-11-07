'use client'

import React, { useEffect, useState } from 'react'
import { Toast as ToastType } from '../providers/ToastProvider'

interface ToastProps {
  toast: ToastType
  onClose: (id: string) => void
}

// Iconos SVG para cada tipo
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
)

const InfoCircleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
)

const ExclamationTriangleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

// Estilos según tipo (success, error, info, warning)
const toastStyles = {
  success: {
    container: 'bg-green-50 border-green-500 text-green-800',
    icon: 'text-green-500'
  },
  error: {
    container: 'bg-red-50 border-red-500 text-red-800',
    icon: 'text-red-500'
  },
  info: {
    container: 'bg-blue-50 border-blue-500 text-blue-800',
    icon: 'text-blue-500'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    icon: 'text-yellow-500'
  }
}

const icons = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  info: InfoCircleIcon,
  warning: ExclamationTriangleIcon
}

export function Toast({ toast, onClose }: ToastProps) {
  const styles = toastStyles[toast.type]
  const Icon = icons[toast.type]
  const [progress, setProgress] = useState(100)

  // Implementar barra de progreso para auto-dismiss
  useEffect(() => {
    // Solo mostrar progreso si tiene duración definida
    const duration = toast.duration !== undefined ? toast.duration : 5000
    if (duration <= 0) {
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [toast.duration])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        ${styles.container}
        border-l-4 rounded-lg shadow-lg
        flex flex-col min-w-[320px] max-w-md
        animate-slide-in-right overflow-hidden
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <Icon />
        </div>
        
        <div className="flex-1 text-sm font-medium">
          {toast.message}
        </div>
        
        {toast.dismissible && (
          <button
            onClick={() => onClose(toast.id)}
            className={`
              flex-shrink-0 ${styles.icon} hover:opacity-70 
              transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 
              focus:ring-offset-2 rounded hover:scale-110
            `}
            aria-label="Cerrar notificación"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Indicador visual de progreso para auto-dismiss */}
      {toast.duration !== 0 && (
        <div className="h-1 bg-black bg-opacity-10">
          <div
            className={`h-full ${styles.icon} bg-current transition-all ease-linear`}
            style={{ 
              width: `${progress}%`,
              transitionDuration: '16ms'
            }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
