"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import { getDocument, requestDocumentAuthentication, Document } from '../../../lib/documents-utils'
import { APP_ROUTES } from '@/lib/api-constants'
import ErrorBoundaryWithToast from '../../components/ErrorBoundaryWithToast'
import { useToast } from '../../hooks/useToast'

function DocumentDetailPageContent() {
  const params = useParams()
  const router = useRouter()
  const { fetchWithRefresh } = useAuth()
  const toast = useToast()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticating, setAuthenticating] = useState(false)

  const documentId = params.id as string

  useEffect(() => {
    if (documentId) {
      loadDocument()
    }
  }, [documentId])

  async function loadDocument() {
    try {
      setLoading(true)
      const doc = await getDocument(fetchWithRefresh, documentId)
      setDocument(doc)
    } catch (err: any) {
      console.error('Error loading document:', err)
      toast.error(err.message || 'Error al cargar el documento')
    } finally {
      setLoading(false)
    }
  }

  async function handleAuthenticate() {
    if (!document) return

    try {
      setAuthenticating(true)
      toast.info('Iniciando autenticación del documento...')
      await requestDocumentAuthentication(fetchWithRefresh, document.id)
      await loadDocument()
      toast.success('Documento autenticado exitosamente')
    } catch (err: any) {
      console.error('Error authenticating document:', err)
      toast.error('Error al solicitar autenticación del documento')
    } finally {
      setAuthenticating(false)
    }
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('video')) return '🎥'
    if (mimeType.includes('audio')) return '🎵'
    if (mimeType.includes('text')) return '📝'
    return '📁'
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function getStatusColor(status: string) {
    if (!status || status === 'string') return 'text-gray-600 bg-gray-100'

    switch (status.toLowerCase()) {
      case 'authenticated':
        return 'text-green-600 bg-green-100'
      case 'authenticating':
        return 'text-blue-600 bg-blue-100'
      case 'unauthenticated':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  function getStatusText(status: string) {
    if (!status || status === 'string') return 'Desconocido'

    switch (status.toLowerCase()) {
      case 'authenticated':
        return 'Autenticado'
      case 'authenticating':
        return 'Autenticando'
      case 'unauthenticated':
        return 'No Autenticado'
      default:
        return 'Desconocido'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando documento...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Documento no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push(APP_ROUTES.DOCUMENTS.BASE)}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words leading-tight">{document.filename}</h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">ID: {document.id}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(document.authentication_status)}`}>
                {getStatusText(document.authentication_status)}
              </span>
              {document.authentication_status === 'unauthenticated' && (
                <button
                  onClick={handleAuthenticate}
                  disabled={authenticating}
                  className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-xs sm:text-sm w-full sm:w-auto"
                >
                  {authenticating ? 'Autenticando...' : 'Autenticar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Información del Documento</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">{getFileIcon(document.mime_type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base break-words leading-tight">{document.filename}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{document.mime_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Tamaño</p>
                  <p className="font-medium text-sm sm:text-base">{formatFileSize(document.size_bytes || 0)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Propietario ID</p>
                  <p className="font-medium text-sm sm:text-base">{document.owner_id}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Hash SHA256</p>
                  <div className="bg-gray-100 p-2 sm:p-3 rounded border">
                    <p className="font-mono text-xs break-all leading-relaxed">{document.hash_sha256}</p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">Estado</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.authentication_status)}`}>
                    {getStatusText(document.authentication_status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Vista Previa</h2>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {document.url ? (
                <div className="w-full h-full">
                  {document.mime_type.includes('image') ? (
                    <img
                      src={document.url}
                      alt={document.filename}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : document.mime_type.includes('pdf') ? (
                    <iframe
                      src={document.url}
                      className="w-full h-full rounded-lg"
                      title={document.filename}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">{getFileIcon(document.mime_type)}</div>
                      <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">Vista previa no disponible</p>
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                      >
                        Descargar Archivo
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 p-4">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">📁</div>
                  <p className="text-sm sm:text-base">URL de descarga no disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function DocumentDetailPage() {
  return (
    <ErrorBoundaryWithToast>
      <DocumentDetailPageContent />
    </ErrorBoundaryWithToast>
  )
}
