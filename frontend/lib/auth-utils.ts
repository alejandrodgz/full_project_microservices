import { AUTH_BASE_URL, buildAuthUrl, AUTH_ENDPOINTS } from './api-constants'

export const AUTH_BASE = AUTH_BASE_URL

export interface AuthError {
  error: string
  code?: string
  details?: string
  status: number
  url?: string
}

export interface AuthResponse<T = any> {
  data?: T
  error?: string
  code?: string
  details?: string
  status: number
}

function buildErrorResponse(error: string, status: number = 500, code: string = 'UNKNOWN_ERROR', details?: string, url?: string): Response {
  const errorResponse: AuthError = { error, code, details: details || `HTTP ${status}`, status, url }
  return new Response(JSON.stringify(errorResponse), { status, headers: { 'Content-Type': 'application/json' } })
}

function buildSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function parseResponseData(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type')
  
  if (contentType && contentType.includes('application/json')) {
    return response.json().catch(() => ({
      error: 'Respuesta inválida del microservicio de autenticación',
      details: 'El servidor devolvió contenido que no es JSON válido',
      status: response.status
    }))
  }
  
  return response.text().then(textResponse => ({
    error: 'Microservicio de autenticación no disponible',
    details: `El servidor devolvió: ${response.status} ${response.statusText}`,
    status: response.status,
    response: textResponse.substring(0, 200)
  }))
}

function classifyError(err: Error): { message: string; code: string; status: number } {
  if (err.message.includes('fetch')) {
    return { message: 'Microservicio de autenticación no disponible', code: 'SERVICE_UNAVAILABLE', status: 503 }
  }
  if (err.message.includes('JSON')) {
    return { message: 'Respuesta inválida del microservicio de autenticación', code: 'INVALID_RESPONSE', status: 502 }
  }
  if (err.message.includes('timeout')) {
    return { message: 'Timeout al conectar con el microservicio de autenticación', code: 'TIMEOUT_ERROR', status: 504 }
  }
  return { message: err.message, code: 'NETWORK_ERROR', status: 500 }
}

export function createErrorResponse(error: string, status: number = 500, code: string = 'UNKNOWN_ERROR', details?: string, url?: string): Response {
  return buildErrorResponse(error, status, code, details, url)
}

export function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return buildSuccessResponse(data, status)
}

export function handleAuthError(err: any, endpoint: string): Response {
  const url = buildAuthUrl(endpoint)
  const { message, code, status } = err instanceof Error ? classifyError(err) : { message: 'Error de conexión con el microservicio de autenticación', code: 'NETWORK_ERROR', status: 500 }
  
  return buildErrorResponse(message, status, code, `Error al conectar con ${url}`, url)
}

function validateRequiredFields(body: any, fields: string[]): string | null {
  const missingFields = fields.filter(field => !body[field])
  return missingFields.length > 0 ? `Campos requeridos faltantes: ${missingFields.join(', ')}` : null
}

export function validateRegistrationFields(body: any): string | null {
  return validateRequiredFields(body, ['email', 'password', 'name', 'id_citizen'])
}

export function validateLoginFields(body: any): string | null {
  return validateRequiredFields(body, ['email', 'password'])
}

export async function makeAuthRequest(endpoint: string, method: string = 'POST', body?: any, headers: Record<string, string> = {}): Promise<{ response: Response; data: any }> {
  try {
    const url = buildAuthUrl(endpoint)
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined
    })
    
    const data = await parseResponseData(response)
    return { response, data }
  } catch (networkError) {
    throw new Error(`Error de conexión con el microservicio de autenticación: ${networkError instanceof Error ? networkError.message : 'Error desconocido'}`)
  }
}

export function extractErrorInfo(data: any, response: Response, endpoint: string): AuthError {
  return {
    error: data?.error || data?.message || 'Solicitud fallida',
    code: data?.code || 'API_ERROR',
    details: data?.details || `HTTP ${response.status}: ${response.statusText}`,
    status: response.status,
    url: buildAuthUrl(endpoint)
  }
}
