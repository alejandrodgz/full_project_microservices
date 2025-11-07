'use client'

import React, { ReactNode, useEffect, useRef } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { useToast } from '../hooks/useToast'

interface ErrorBoundaryWithToastProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

export default function ErrorBoundaryWithToast({ 
  children, 
  fallback 
}: ErrorBoundaryWithToastProps) {
  const toast = useToast()
  const hasShownToast = useRef(false)

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    if (!hasShownToast.current) {
      toast.error(error.message || 'Ha ocurrido un error inesperado')
      hasShownToast.current = true
    }
  }

  const resetToastFlag = () => {
    hasShownToast.current = false
  }

  useEffect(() => {
    return () => {
      hasShownToast.current = false
    }
  }, [])

  return (
    <ErrorBoundary 
      onError={handleError}
      fallback={fallback ? (error, reset) => {
        const wrappedReset = () => {
          resetToastFlag()
          reset()
        }
        return fallback(error, wrappedReset)
      } : undefined}
    >
      {children}
    </ErrorBoundary>
  )
}
