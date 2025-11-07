export function getFriendlyErrorMessage(error: string, code?: string): string {
  const errorLower = error.toLowerCase()
  
  // Verificar si el error contiene el código directamente
  if (errorLower.includes('invalid_credentials') || errorLower.includes('invalid credentials') || errorLower.includes('unauthorized') || code === 'INVALID_CREDENTIALS') {
    return 'Email o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.'
  }
  
  if (errorLower.includes('user not found') || errorLower.includes('usuario no encontrado')) {
    return 'No existe una cuenta con este email. Verifica tu email o regístrate.'
  }
  
  if (errorLower.includes('password') && errorLower.includes('incorrect')) {
    return 'La contraseña es incorrecta. Intenta nuevamente o recupera tu contraseña.'
  }
  
  if (errorLower.includes('account locked') || errorLower.includes('cuenta bloqueada')) {
    return 'Tu cuenta está temporalmente bloqueada. Contacta al soporte técnico.'
  }
  
  if (errorLower.includes('service unavailable') || errorLower.includes('microservicio no disponible')) {
    return 'El servicio está temporalmente no disponible. Intenta nuevamente en unos minutos.'
  }
  
  if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout')) {
    return 'Problema de conexión. Verifica tu internet e intenta nuevamente.'
  }
  
  if (errorLower.includes('validation') || errorLower.includes('campos requeridos')) {
    return 'Por favor completa todos los campos requeridos correctamente.'
  }
  
  return 'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.'
}

export function getFriendlyRegisterErrorMessage(error: string, code?: string): string {
  const errorLower = error.toLowerCase()
  
  // Check for "user already exists" error from backend
  if (errorLower.includes('user already exists') || errorLower.includes('usuario ya existe') || errorLower.includes('already exists')) {
    return 'Este usuario ya está registrado. Intenta iniciar sesión o usa otro email/cédula.'
  }
  
  if (errorLower.includes('email already exists') || errorLower.includes('email ya existe') || errorLower.includes('duplicate')) {
    return 'Ya existe una cuenta con este email. Intenta con otro email o inicia sesión.'
  }
  
  if (errorLower.includes('id_citizen') && errorLower.includes('duplicate')) {
    return 'Este número de cédula ya está registrado. Verifica tu número de identificación.'
  }
  
  if (errorLower.includes('validation') || errorLower.includes('campos requeridos')) {
    return 'Por favor completa todos los campos correctamente.'
  }
  
  if (errorLower.includes('password') && (errorLower.includes('weak') || errorLower.includes('débil'))) {
    return 'La contraseña debe tener al menos 8 caracteres y ser más segura.'
  }
  
  if (errorLower.includes('service unavailable') || errorLower.includes('microservicio no disponible')) {
    return 'El servicio está temporalmente no disponible. Intenta nuevamente en unos minutos.'
  }
  
  if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout')) {
    return 'Problema de conexión. Verifica tu internet e intenta nuevamente.'
  }
  
  return 'No se pudo crear la cuenta. Verifica los datos e intenta nuevamente.'
}

export function parseErrorMessage(err: any, fallbackMessage: string): string {
  try {
    // Si err.message es un string JSON, parsearlo
    if (typeof err.message === 'string') {
      const errorData = JSON.parse(err.message)
      // Retornar el error y el código si existe
      if (errorData.error) {
        return errorData.error
      }
      if (errorData.code) {
        return errorData.code
      }
    }
    // Si err es directamente un objeto con error
    if (err.error) {
      return err.error
    }
    return fallbackMessage
  } catch {
    // Si no se puede parsear, intentar usar el mensaje directamente
    if (err.message && typeof err.message === 'string') {
      return err.message
    }
    return fallbackMessage
  }
}

// Función para manejar errores de autenticación con toast
export function handleAuthError(err: any, toast: any) {
  const errorMessage = parseErrorMessage(err, 'Error de autenticación')
  const friendlyMessage = getFriendlyErrorMessage(errorMessage)
  toast.error(friendlyMessage)
}

// Función para manejar errores de documentos con toast
export function handleDocumentError(err: any, toast: any, defaultMessage: string) {
  const errorMessage = err instanceof Error ? err.message : defaultMessage
  toast.error(errorMessage)
}
