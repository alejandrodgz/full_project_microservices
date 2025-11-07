"use client"
import { useAuth } from '../providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { APP_ROUTES } from '@/lib/api-constants'
import { getDocuments, deleteDocument, deleteAllDocuments, uploadDocument, Document, DocumentsListResponse } from '../../lib/documents-utils'
import ErrorBoundaryWithToast from '../components/ErrorBoundaryWithToast'
import { useToast } from '../hooks/useToast'

function DocumentsPageContent() {
  const { user, loading, fetchWithRefresh } = useAuth()
  const router = useRouter()
  const toast = useToast()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsData, setDocumentsData] = useState<DocumentsListResponse | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(5)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: 'pending' | 'uploading' | 'completed' | 'error' }>({})
  const loadingRef = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push(APP_ROUTES.LOGIN)
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && user && !loadingRef[0]) {
      loadDocuments()
    }
  }, [user, loading, currentPage])

  const loadDocuments = async () => {
    if (!user || loadingRef[0]) return
    
    loadingRef[0] = true
    setDocumentsLoading(true)
    
    try {
      const data = await getDocuments(fetchWithRefresh, { page: currentPage, limit })
      setDocuments(data.documents)
      setDocumentsData(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar documentos')
    } finally {
      setDocumentsLoading(false)
      loadingRef[0] = false
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      return
    }
    
    try {
      await deleteDocument(fetchWithRefresh, documentId)
      toast.success('Documento eliminado exitosamente')
      await loadDocuments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar documento')
    }
  }

  const handleDeleteAllDocuments = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar TODOS los documentos? Esta acción no se puede deshacer.')) {
      return
    }
    
    try {
      await deleteAllDocuments(fetchWithRefresh)
      toast.success('Todos los documentos fueron eliminados exitosamente')
      await loadDocuments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar todos los documentos')
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) {
      return
    }

    setSelectedFiles(files)
    setShowPreview(true)
    
    const progress: { [key: string]: 'pending' | 'uploading' | 'completed' | 'error' } = {}
    files.forEach(file => {
      progress[file.name] = 'pending'
    })
    setUploadProgress(progress)
    
    event.target.value = ''
  }

  const handleConfirmUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    toast.info(`Subiendo ${selectedFiles.length} documento${selectedFiles.length > 1 ? 's' : ''}...`)

    try {
      let hasErrors = false
      let successCount = 0
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 'uploading'
        }))
        
        try {
          await uploadDocument(fetchWithRefresh, file)
          
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 'completed'
          }))
          successCount++
        } catch (err) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 'error'
          }))
          
          hasErrors = true
          console.error(`Error uploading ${file.name}:`, err)
        }
      }
      await loadDocuments()
      
      if (!hasErrors) {
        toast.success(`${successCount} documento${successCount > 1 ? 's subidos' : ' subido'} exitosamente`)
        setSelectedFiles([])
        setShowPreview(false)
        setUploadProgress({})
      } else {
        if (successCount > 0) {
          toast.warning(`${successCount} documento${successCount > 1 ? 's subidos' : ' subido'}, pero algunos fallaron`)
        } else {
          toast.error('Error al subir documentos')
        }
        setTimeout(() => {
          setSelectedFiles([])
          setShowPreview(false)
          setUploadProgress({})
        }, 3000)
      }
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir documentos')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelUpload = () => {
    setSelectedFiles([])
    setShowPreview(false)
    setUploadProgress({})
  }

  const handleRemoveFile = (fileName: string) => {
    const newFiles = selectedFiles.filter(file => file.name !== fileName)
    setSelectedFiles(newFiles)
    
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileName]
      return newProgress
    })
    
    if (newFiles.length === 0) {
      setShowPreview(false)
    }
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
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <style jsx>{`
        .word-break-all {
          word-break: break-all !important;
          overflow-wrap: break-word !important;
          hyphens: auto !important;
        }
        .card-container {
          max-width: 100% !important;
          overflow: hidden !important;
        }
      `}</style>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
            <div className="w-full lg:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mis Documentos</h1>
              <p className="text-sm sm:text-base text-gray-600">Gestiona y organiza todos tus documentos digitales</p>
            </div>
            
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
              <label className="relative group cursor-pointer w-full sm:w-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span className="hidden sm:inline">Subiendo...</span>
                      <span className="sm:hidden">Subiendo</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Subir Documentos</span>
                      <span className="sm:hidden">Subir</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </label>
              
        <button 
                onClick={handleDeleteAllDocuments}
                className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                disabled={!documents || documents.length === 0}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Eliminar Todos</span>
                <span className="sm:hidden">Eliminar</span>
        </button>
            </div>
          </div>
        </div>

        {/* Vista Previa de Archivos */}
        {showPreview && selectedFiles.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Archivos Seleccionados ({selectedFiles.length})
              </h3>
            </div>
            
            <div className="space-y-3 mb-4">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-white p-3 rounded-lg border group hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB • {file.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-3">
                    {/* Estado de progreso */}
                    {uploadProgress[file.name] === 'pending' && (
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    {uploadProgress[file.name] === 'uploading' && (
                      <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    )}
                    {uploadProgress[file.name] === 'completed' && (
                      <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {uploadProgress[file.name] === 'error' && (
                      <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    
                    {uploadProgress[file.name] === 'pending' && (
                      <button
                        onClick={() => handleRemoveFile(file.name)}
                        className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200"
                        title="Eliminar archivo"
                      >
                        <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-all duration-200 text-sm"
              >
                Cancelar Todo
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">Subir Todos ({selectedFiles.length})</span>
                    <span className="sm:hidden">Subir ({selectedFiles.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm sm:text-base text-blue-700 font-medium">Subiendo documento...</p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Documentos */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Lista de Documentos</h2>
            {documentsData && (
              <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full">
                {documents?.length || 0} de {documentsData.total} documentos
              </div>
            )}
      </div>
      
          {documentsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Cargando documentos...</p>
            </div>
          ) : !documents || documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-gray-500">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-base sm:text-lg font-medium mb-2">No hay documentos</p>
              <p className="text-xs sm:text-sm text-center px-4">Sube tu primer documento para comenzar</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6 sm:mb-8">
                {documents.map((doc) => (
                  <div key={doc.id} className="card-container bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 group overflow-hidden cursor-pointer" onClick={() => router.push(APP_ROUTES.DOCUMENTS.BY_ID(doc.id))}>
                    {/* Header con título y botón */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base break-words leading-tight">{doc.filename || doc.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{doc.mime_type || doc.type}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDocument(doc.id)
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-1 text-xs sm:text-sm flex-shrink-0"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                    
                    {/* Metadata en layout vertical para móviles */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs font-medium">Tamaño:</span>
                        <span className="font-medium text-xs">{((doc.size_bytes || doc.size || 0) / 1024).toFixed(2)} KB</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs font-medium">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(doc.authentication_status)}`}>
                          {getStatusText(doc.authentication_status)}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-gray-500 text-xs font-medium">Hash:</span>
                        <div className="bg-gray-100 p-2 rounded border max-w-full">
                          <p className="font-mono text-xs break-all leading-relaxed word-break-all">{doc.hash_sha256}</p>
                        </div>
                      </div>
                      
                      {doc.url && (
                        <div className="space-y-1">
                          <span className="text-gray-500 text-xs font-medium">URL:</span>
                          <div className="bg-gray-100 p-2 rounded border max-w-full">
                            <p className="font-mono text-xs break-all leading-relaxed word-break-all">{doc.url}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {documentsData && documentsData.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                  <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                    Mostrando <span className="font-semibold">{documents?.length || 0}</span> de <span className="font-semibold">{documentsData.total}</span> documentos
      </div>

                  <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, documentsData.totalPages) }, (_, i) => {
                        const pageNum = currentPage <= 2 ? i + 1 : 
                                       currentPage >= documentsData.totalPages - 1 ? 
                                       documentsData.totalPages - 2 + i : 
                                       currentPage - 1 + i
                        
                        if (pageNum < 1 || pageNum > documentsData.totalPages) return null
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-all duration-200 text-xs sm:text-sm ${
                              pageNum === currentPage
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === documentsData.totalPages}
                      className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Siguiente</span>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}


export default function DocumentsPage() {
  return (
    <ErrorBoundaryWithToast>
      <DocumentsPageContent />
    </ErrorBoundaryWithToast>
  )
}
