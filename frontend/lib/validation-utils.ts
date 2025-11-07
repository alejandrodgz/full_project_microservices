export function validateEmail(email: string): string | null {
  if (!email) return 'Email es requerido'
  
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i
  if (!re.test(email)) return 'Email no tiene formato válido'
  
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Contraseña es requerida'
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
  
  return null
}

export function validateName(name: string): string | null {
  if (!name) return 'Nombre es requerido'
  if (name.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
  
  return null
}

export function validateIdCitizen(idCitizen: number | string): string | null {
  if (!idCitizen) return 'ID Ciudadano es requerido'
  if (Number.isNaN(Number(idCitizen))) return 'ID Ciudadano debe ser un número'
  if (Number(idCitizen) <= 0) return 'ID Ciudadano debe ser un número positivo'
  
  return null
}

export function validateLoginForm(email: string, password: string): string | null {
  // Validar que el email no esté vacío
  if (!email || !email.trim()) {
    return 'El usuario es requerido'
  }
  
  // Validar formato de email
  const emailError = validateEmail(email)
  if (emailError) return emailError
  
  // Validar contraseña
  if (!password || !password.trim()) {
    return 'La contraseña es requerida'
  }
  
  const passwordError = validatePassword(password)
  if (passwordError) return passwordError
  
  return null
}

export function validateUserLocal(userLocal: string): string | null {
  if (!userLocal || !userLocal.trim()) {
    return 'El usuario es requerido'
  }
  
  // Verificar que no contenga @
  if (userLocal.includes('@')) {
    return 'No incluyas @ en el usuario. Solo escribe tu nombre de usuario (ej: juan.perez)'
  }
  
  // Verificar que no contenga espacios
  if (userLocal.includes(' ')) {
    return 'El usuario no puede contener espacios'
  }
  
  // Verificar longitud mínima
  if (userLocal.trim().length < 3) {
    return 'El usuario debe tener al menos 3 caracteres'
  }
  
  return null
}

export function validateRegisterForm(email: string, password: string, name: string, idCitizen: number | string): string | null {
  const emailError = validateEmail(email)
  if (emailError) return emailError
  
  const passwordError = validatePassword(password)
  if (passwordError) return passwordError
  
  const nameError = validateName(name)
  if (nameError) return nameError
  
  const idError = validateIdCitizen(idCitizen)
  if (idError) return idError
  
  return null
}
