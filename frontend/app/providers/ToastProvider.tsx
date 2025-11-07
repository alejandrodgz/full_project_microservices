'use client'

import React, { createContext, useState, useRef, useEffect, useCallback } from 'react'
import { ToastContainer } from '../components/ToastContainer'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
  dismissible?: boolean
}

export interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Cleanup de temporizadores al desmontar
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      timeoutsRef.current.clear()
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`
    const newToast: Toast = { 
      ...toast, 
      id,
      dismissible: toast.dismissible !== false // Por defecto true
    }
    
    setToasts(prev => {
      // Evitar duplicados: verificar si ya existe un toast con el mismo mensaje y tipo en los últimos 500ms
      const isDuplicate = prev.some(existingToast => 
        existingToast.message === newToast.message && 
        existingToast.type === newToast.type &&
        (Date.now() - parseInt(existingToast.id.split('-')[0])) < 500
      )
      
      if (isDuplicate) {
        return prev
      }
      
      const updated = [...prev, newToast]
      // Implementar límite de 5 toasts máximo
      return updated.slice(-5)
    })
    
    // Auto-dismiss con temporizadores
    const duration = toast.duration !== undefined ? toast.duration : 5000
    if (duration > 0) {
      const timeout = setTimeout(() => {
        removeToast(id)
      }, duration)
      
      timeoutsRef.current.set(id, timeout)
    }
  }, [removeToast])

  // Funciones helper: success, error, info, warning
  const success = useCallback((message: string, duration?: number) => {
    addToast({ type: 'success', message, duration })
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    addToast({ type: 'error', message, duration })
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    addToast({ type: 'info', message, duration })
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    addToast({ type: 'warning', message, duration })
  }, [addToast])

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}
