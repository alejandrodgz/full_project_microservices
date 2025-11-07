import { DOCUMENTS_BASE_URL, buildDocumentsUrl as buildUrl, buildPaginationParams, API_ROUTES } from './api-constants'

export const DOCUMENTS_BASE = DOCUMENTS_BASE_URL

export interface DocumentsError {
  error: string
  code?: string
  details?: string
  status: number
  url?: string
}

export interface DocumentsResponse<T = any> {
  data?: T
  error?: string
  code?: string
  details?: string
  status: number
}

export interface Document {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
  hash_sha256: string
  owner_id: number
  authentication_status: string
  url: string
  name?: string
  type?: string
  size?: number
  uploadedAt?: string
  metadata?: Record<string, any>
}

export interface DocumentsListResponse {
  documents: Document[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DocumentsParams {
  page?: number
  limit?: number
}

function buildDocumentsUrl(endpoint: string): string {
  return buildUrl(endpoint)
}

function createErrorResponse(error: string, status: number = 500, code: string = 'UNKNOWN_ERROR', details?: string, url?: string): Response {
  const errorResponse: DocumentsError = { error, code, details: details || `HTTP ${status}`, status, url }
  return new Response(JSON.stringify(errorResponse), { status, headers: { 'Content-Type': 'application/json' } })
}

function createSuccessResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function parseResponseData(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type')
  
  if (contentType && contentType.includes('application/json')) {
    return response.json().catch(() => ({
      error: 'Respuesta inválida del microservicio',
      details: 'El servidor devolvió contenido que no es JSON válido',
      status: response.status
    }))
  }
  
  return response.text().then(textResponse => ({
    error: 'Microservicio no disponible',
    details: `El servidor devolvió: ${response.status} ${response.statusText}`,
    status: response.status,
    response: textResponse.substring(0, 200)
  }))
}

function classifyError(err: Error): { message: string; code: string; status: number } {
  if (err.message.includes('fetch')) {
    return { message: 'Microservicio no disponible', code: 'SERVICE_UNAVAILABLE', status: 503 }
  }
  if (err.message.includes('JSON')) {
    return { message: 'Respuesta inválida del microservicio', code: 'INVALID_RESPONSE', status: 502 }
  }
  if (err.message.includes('timeout')) {
    return { message: 'Timeout al conectar con el microservicio', code: 'TIMEOUT_ERROR', status: 504 }
  }
  return { message: err.message, code: 'NETWORK_ERROR', status: 500 }
}

export function createDocumentsErrorResponse(error: string, status: number = 500, code: string = 'UNKNOWN_ERROR', details?: string, url?: string): Response {
  return createErrorResponse(error, status, code, details, url)
}

export function createDocumentsSuccessResponse<T>(data: T, status: number = 200): Response {
  return createSuccessResponse(data, status)
}

export function handleDocumentsError(err: any, endpoint: string): Response {
  const url = buildDocumentsUrl(endpoint)
  const { message, code, status } = err instanceof Error ? classifyError(err) : { message: 'Error de conexión con el microservicio', code: 'NETWORK_ERROR', status: 500 }
  
  return createErrorResponse(message, status, code, `Error al conectar con ${url}`, url)
}

export function validatePaginationParams(params: DocumentsParams): string | null {
  const { page = 1, limit = 5 } = params
  
  if (page < 1) return 'La página debe ser mayor a 0'
  if (limit < 1 || limit > 50) return 'El límite debe estar entre 1 y 50'
  
  return null
}

export async function makeDocumentsRequest(endpoint: string, method: string = 'GET', body?: any, headers: Record<string, string> = {}): Promise<{ response: Response; data: any }> {
  const url = buildDocumentsUrl(endpoint)
  
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined
    })
    
    const data = await parseResponseData(response)
    return { response, data }
  } catch (networkError) {
    throw new Error(`Error de conexión con el microservicio: ${networkError instanceof Error ? networkError.message : 'Error desconocido'}`)
  }
}

export function extractDocumentsErrorInfo(data: any, response: Response, endpoint: string): DocumentsError {
  return {
    error: data?.error || data?.message || 'Solicitud fallida',
    code: data?.code || 'API_ERROR',
    details: data?.details || `HTTP ${response.status}: ${response.statusText}`,
    status: response.status,
    url: buildDocumentsUrl(endpoint)
  }
}

export function validateAuth(cookieStore: any): string | null {
  const accessToken = cookieStore.get('access_token')?.value || cookieStore.get('token')?.value
  return accessToken ? null : 'Token de acceso requerido'
}

export function getAccessToken(cookieStore: any): string | null {
  return cookieStore.get('access_token')?.value || cookieStore.get('token')?.value
}

async function handleApiResponse(response: Response, errorMessage: string): Promise<any> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: errorMessage }))
    throw new Error(errorData.error || errorMessage)
  }
  return response.json()
}

function extractDocumentsFromResponse(result: any, page: number, limit: number): DocumentsListResponse {
  if (result.success && result.data) {
    return {
      documents: result.data.documents || [],
      total: result.data.pagination?.total_items || 0,
      page: result.data.pagination?.page || page,
      limit: result.data.pagination?.limit || limit,
      totalPages: result.data.pagination?.total_pages || 1
    }
  }
  return result
}

function extractDocumentFromResponse(result: any): Document {
  if (result.success && result.data) {
    return result.data
  }
  return result.document || result
}

export async function getDocuments(fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>, params: DocumentsParams = {}): Promise<DocumentsListResponse> {
  const { page = 1, limit = 5 } = params
  const queryParams = buildPaginationParams(page, limit)
  
  const response = await fetchWithRefresh(`${API_ROUTES.DOCUMENTS.BASE}?${queryParams}`)
  const result = await handleApiResponse(response, 'Error al obtener documentos')
  
  return extractDocumentsFromResponse(result, page, limit)
}

export async function getDocument(fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>, documentId: string): Promise<Document> {
  const response = await fetchWithRefresh(API_ROUTES.DOCUMENTS.BY_ID(documentId))
  const result = await handleApiResponse(response, 'Error al obtener documento')
  
  return extractDocumentFromResponse(result)
}

export async function deleteDocument(fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>, documentId: string): Promise<void> {
  const response = await fetchWithRefresh(API_ROUTES.DOCUMENTS.BY_ID(documentId), { method: 'DELETE' })
  await handleApiResponse(response, 'Error al eliminar documento')
}

export async function deleteAllDocuments(fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>): Promise<void> {
  const response = await fetchWithRefresh(API_ROUTES.DOCUMENTS.BASE, { method: 'DELETE' })
  await handleApiResponse(response, 'Error al eliminar todos los documentos')
}

export async function requestDocumentAuthentication(fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>, documentId: string): Promise<void> {
  const response = await fetchWithRefresh(API_ROUTES.DOCUMENTS.AUTHENTICATE(documentId), { method: 'POST' })
  await handleApiResponse(response, 'Error al solicitar autenticación del documento')
}

export async function uploadDocument(fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>, file: File): Promise<Document> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetchWithRefresh(API_ROUTES.DOCUMENTS.BASE, { method: 'POST', body: formData })
  const result = await handleApiResponse(response, 'Error al subir documento')
  
  return extractDocumentFromResponse(result)
}
