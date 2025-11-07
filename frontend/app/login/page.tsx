"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { getFriendlyErrorMessage, parseErrorMessage } from '../../lib/error-utils'
import { APP_ROUTES } from '@/lib/api-constants'
import { validateLoginForm } from '../../lib/validation-utils'
import { AuthLayout, SubmitButton } from '../components/FormComponents'
import { useFormState } from '../hooks/useFormState'
import { useToast } from '../hooks/useToast'
import ErrorBoundaryWithToast from '../components/ErrorBoundaryWithToast'

function LoginPageContent() {
  const router = useRouter()
  const { login } = useAuth()
  const toast = useToast()
  const { state, error, loading, updateField, setFormError, setFormLoading } = useFormState({
    emailLocal: '',
    password: ''
  })

  const domainSuffix = '@ccp.com'

  function buildEmail(local: string) {
    const trimmed = (local || '').trim()
    return trimmed ? `${trimmed}${domainSuffix}` : ''
  }

  function validate() {
    setFormError(null)

    // Primero validar el campo de usuario local
    const userLocal = (state.emailLocal as unknown as string) || ''

    // Verificar que no contenga @
    if (userLocal.includes('@')) {
      const error = 'No incluyas @ en el usuario. Solo escribe tu nombre de usuario (ej: juan.perez)'
      setFormError(error)
      toast.error(error)
      return false
    }

    // Verificar que no esté vacío
    if (!userLocal.trim()) {
      const error = 'El usuario es requerido'
      setFormError(error)
      toast.error(error)
      return false
    }

    // Verificar longitud mínima
    if (userLocal.trim().length < 3) {
      const error = 'El usuario debe tener al menos 3 caracteres'
      setFormError(error)
      toast.error(error)
      return false
    }

    // Validar contraseña
    const password = (state.password as unknown as string) || ''
    if (!password.trim()) {
      const error = 'La contraseña es requerida'
      setFormError(error)
      toast.error(error)
      return false
    }

    if (password.length < 8) {
      const error = 'La contraseña debe tener al menos 8 caracteres'
      setFormError(error)
      toast.error(error)
      return false
    }

    // Validar el email completo
    const emailFull = buildEmail(userLocal)
    const validationError = validateLoginForm(emailFull, password)
    if (validationError) {
      setFormError(validationError)
      toast.error(validationError)
      return false
    }

    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setFormLoading(true)
    setFormError(null)

    try {
      const emailFull = buildEmail(state.emailLocal as unknown as string)
      await login(emailFull, state.password as unknown as string)
      toast.success('Inicio de sesión exitoso')
      router.push(APP_ROUTES.DOCUMENTS.BASE)
    } catch (err: any) {
      // Solo mostrar en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err)
      }

      // Intentar extraer el código de error
      let errorCode: string | undefined
      try {
        const errorData = JSON.parse(err.message)
        errorCode = errorData.code
      } catch {
        // Ignorar si no se puede parsear
      }

      const errorMessage = parseErrorMessage(err, 'Error al iniciar sesión')
      const friendlyMessage = getFriendlyErrorMessage(errorMessage, errorCode)
      toast.error(friendlyMessage)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Accede a tu Carpeta Ciudadana"
      linkText="¿No tienes cuenta?"
      linkHref={APP_ROUTES.REGISTER}
      linkLabel="Regístrate aquí"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
          <div className="flex items-stretch">
            <input
              required
              value={state.emailLocal as unknown as string}
              onChange={e => updateField('emailLocal' as any, e.target.value)}
              type="text"
              placeholder="tu.usuario"
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <span className="inline-flex items-center px-2 sm:px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-600 text-xs sm:text-sm rounded-r-xl select-none whitespace-nowrap">
              {domainSuffix}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            required
            value={state.password as unknown as string}
            onChange={e => updateField('password' as any, e.target.value)}
            placeholder="Contraseña"
            type="password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <SubmitButton
          loading={loading}
          loadingText="Entrando..."
          text="Iniciar Sesión"
        />
      </form>
    </AuthLayout>
  )
}


export default function LoginPage() {
  return (
    <ErrorBoundaryWithToast>
      <LoginPageContent />
    </ErrorBoundaryWithToast>
  )
}
