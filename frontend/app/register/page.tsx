"use client"
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { APP_ROUTES } from '@/lib/api-constants'
import { getFriendlyRegisterErrorMessage, parseErrorMessage } from '../../lib/error-utils'
import { validateRegisterForm } from '../../lib/validation-utils'
import { AuthLayout, SubmitButton } from '../components/FormComponents'
import { useFormState } from '../hooks/useFormState'
import { useToast } from '../hooks/useToast'
import ErrorBoundaryWithToast from '../components/ErrorBoundaryWithToast'

function RegisterPageContent() {
  const router = useRouter()
  const { register } = useAuth()
  const toast = useToast()
  const { state, error, loading, updateField, setFormError, setFormLoading } = useFormState({
    emailLocal: '',
    password: '',
    name: '',
    idCitizen: '' as number | string
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
    
    // Validar nombre
    const name = (state.name as unknown as string) || ''
    if (!name.trim()) {
      const error = 'El nombre es requerido'
      setFormError(error)
      toast.error(error)
      return false
    }
    
    if (name.trim().length < 2) {
      const error = 'El nombre debe tener al menos 2 caracteres'
      setFormError(error)
      toast.error(error)
      return false
    }
    
    // Validar ID Ciudadano
    const idCitizen = state.idCitizen
    if (!idCitizen) {
      const error = 'El ID Ciudadano es requerido'
      setFormError(error)
      toast.error(error)
      return false
    }
    
    if (Number.isNaN(Number(idCitizen)) || Number(idCitizen) <= 0) {
      const error = 'El ID Ciudadano debe ser un número válido y positivo'
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
    const validationError = validateRegisterForm(emailFull, password, name, idCitizen)
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
      const payload = { 
        email: buildEmail(state.emailLocal as unknown as string), 
        password: state.password as unknown as string, 
        name: state.name as unknown as string, 
        id_citizen: Number(state.idCitizen) 
      }
      
      await register(payload)
      toast.success('Registro exitoso. Por favor inicia sesión')
      router.push(APP_ROUTES.LOGIN)
    } catch (err: any) {
      // Solo mostrar en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('Register error:', err)
      }
      
      // Intentar extraer el código de error
      let errorCode: string | undefined
      try {
        const errorData = JSON.parse(err.message)
        errorCode = errorData.code
      } catch {
        // Ignorar si no se puede parsear
      }
      
      const errorMessage = parseErrorMessage(err, 'Error al registrarse')
      const friendlyMessage = getFriendlyRegisterErrorMessage(errorMessage, errorCode)
      toast.error(friendlyMessage)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Únete a Carpeta Ciudadana"
      linkText="¿Ya tienes cuenta?"
      linkHref={APP_ROUTES.LOGIN}
      linkLabel="Inicia sesión aquí"
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
              className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
            />
            <span className="inline-flex items-center px-2 sm:px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-600 text-xs sm:text-sm rounded-r-xl select-none whitespace-nowrap">
              {domainSuffix}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            required
            value={state.name as unknown as string}
            onChange={e => updateField('name' as any, e.target.value)}
            placeholder="Nombre completo"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Ciudadano</label>
          <input
            required
            value={state.idCitizen as unknown as string}
            onChange={e => updateField('idCitizen' as any, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="ID Ciudadano"
            type="number"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            required
            value={state.password as unknown as string}
            onChange={e => updateField('password' as any, e.target.value)}
            placeholder="Contraseña"
            type="password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <SubmitButton
          loading={loading}
          loadingText="Registrando..."
          text="Crear Cuenta"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        />
      </form>
    </AuthLayout>
  )
}


export default function RegisterPage() {
  return (
    <ErrorBoundaryWithToast>
      <RegisterPageContent />
    </ErrorBoundaryWithToast>
  )
}
