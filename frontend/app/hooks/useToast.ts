import { useContext } from 'react'
import { ToastContext, ToastContextValue } from '../providers/ToastProvider'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  // Agregar validación de uso dentro del provider
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
