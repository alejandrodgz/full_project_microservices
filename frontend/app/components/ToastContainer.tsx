'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '../hooks/useToast'
import { Toast } from './Toast'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Implementar event listener para cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && toasts.length > 0) {
        // Cerrar el toast más reciente
        const mostRecentToast = toasts[toasts.length - 1]
        removeToast(mostRecentToast.id)
      }
    }

    window.addEventListener('keydown', handleEscape)
    
    // Cleanup del event listener
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [toasts, removeToast])

  if (!mounted) {
    return null
  }

  // Implementar renderizado con createPortal
  return createPortal(
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>,
    document.body
  )
}
