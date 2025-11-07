import { useState } from 'react'

export function useFormState<T>(initialState: T) {
  const [state, setState] = useState(initialState)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const updateField = <K extends keyof T>(field: K, value: T[K]) => {
    setState(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const setFormError = (errorMessage: string | null) => {
    setError(errorMessage)
  }

  const setFormLoading = (isLoading: boolean) => {
    setLoading(isLoading)
  }

  const resetForm = () => {
    setState(initialState)
    setError(null)
    setLoading(false)
  }

  return {
    state,
    error,
    loading,
    updateField,
    setFormError,
    setFormLoading,
    resetForm
  }
}

export function useAuthRedirect() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  const redirectTo = (path: string) => {
    setIsRedirecting(true)
    window.location.href = path
  }

  return {
    isRedirecting,
    redirectTo
  }
}
