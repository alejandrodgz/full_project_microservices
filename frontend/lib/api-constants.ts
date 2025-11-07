/**
 * Constantes de API - Endpoints centralizados
 * 
 * Este archivo contiene todas las rutas de API utilizadas en la aplicación.
 * Facilita el mantenimiento y permite cambios centralizados.
 */

// ============================================
// ENDPOINTS EXTERNOS (Microservicios AWS)
// ============================================

/**
 * Base URL del microservicio de autenticación
 * Configurado desde variables de entorno
 */
export const AUTH_BASE_URL = process.env.AUTH_BASE_URL || ''

/**
 * Base URL del microservicio de documentos
 * Configurado desde variables de entorno
 */
export const DOCUMENTS_BASE_URL = process.env.DOCUMENTS_BASE_URL || ''

// ============================================
// RUTAS DE NAVEGACIÓN (Frontend)
// ============================================

/**
 * Rutas de páginas de la aplicación
 */
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ME: '/me',
  DOCUMENTS: {
    BASE: '/documents',
    BY_ID: (id: string) => `/documents/${id}`,
  },
} as const

// ============================================
// ENDPOINTS INTERNOS (Next.js API Routes)
// ============================================

/**
 * Endpoints de autenticación (Next.js API Routes)
 */
export const API_ROUTES = {
  // Autenticación
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // Documentos
  DOCUMENTS: {
    BASE: '/api/documents',
    BY_ID: (id: string) => `/api/documents/${id}`,
    AUTHENTICATE: (id: string) => `/api/documents/${id}/authenticate`,
  },
} as const

// ============================================
// ENDPOINTS EXTERNOS (Microservicios)
// ============================================

/**
 * Endpoints del microservicio de autenticación
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  REFRESH: '/refresh',
  ME: '/me',
  LOGOUT: '/logout',
} as const

/**
 * Endpoints del microservicio de documentos
 */
export const DOCUMENTS_ENDPOINTS = {
  BASE: '/documents',
  BY_ID: (id: string) => `/documents/${id}`,
  AUTHENTICATE: (id: string) => `/documents/${id}/authenticate`,
} as const

// ============================================
// HELPERS
// ============================================

/**
 * Construye la URL completa para el microservicio de autenticación
 */
export function buildAuthUrl(endpoint: string): string {
  return `${AUTH_BASE_URL}${endpoint}`
}

/**
 * Construye la URL completa para el microservicio de documentos
 */
export function buildDocumentsUrl(endpoint: string): string {
  let url = `${DOCUMENTS_BASE_URL}${endpoint}`
  
  // Evitar duplicación de /api/v1/ si ya está en la base URL
  if (DOCUMENTS_BASE_URL.endsWith('/api/v1/') && endpoint.startsWith('/api/v1/')) {
    url = `${DOCUMENTS_BASE_URL}${endpoint.substring('/api/v1/'.length)}`
  }
  
  return url
}

/**
 * Construye query params para paginación
 */
export function buildPaginationParams(page: number = 1, limit: number = 5): string {
  return new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString()
}

// ============================================
// CONFIGURACIÓN DE COOKIES
// ============================================

/**
 * Configuración de cookies para autenticación
 */
export const COOKIE_CONFIG = {
  ACCESS_TOKEN: {
    name: 'access_token',
    maxAge: 60 * 60 * 24 * 7, // 7 días por defecto
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: false, // HTTP deployment
  },
  REFRESH_TOKEN: {
    name: 'refresh_token',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: false, // HTTP deployment
  },
} as const

// ============================================
// CONFIGURACIÓN GENERAL
// ============================================

/**
 * Configuración general de la aplicación
 */
export const APP_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const
