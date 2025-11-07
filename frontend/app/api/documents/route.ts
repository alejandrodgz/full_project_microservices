import { cookies } from 'next/headers'
import { 
  DOCUMENTS_BASE,
  createDocumentsErrorResponse,
  createDocumentsSuccessResponse,
  handleDocumentsError,
  validatePaginationParams,
  validateAuth,
  getAccessToken,
  makeDocumentsRequest,
  extractDocumentsErrorInfo,
  DocumentsParams
} from '@/lib/documents-utils'
import { DOCUMENTS_ENDPOINTS } from '@/lib/api-constants'

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies()
    
    // Validar autenticación
    const authError = validateAuth(cookieStore)
    if (authError) {
      return createDocumentsErrorResponse(authError, 401, 'MISSING_TOKEN')
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(req.url)
    const params: DocumentsParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10')
    }

    // Validar parámetros
    const validationError = validatePaginationParams(params)
    if (validationError) {
      return createDocumentsErrorResponse(validationError, 400, 'INVALID_PARAMS')
    }

    // Obtener documentos del microservicio
    if (!DOCUMENTS_BASE) {
      return createDocumentsErrorResponse('Microservicio de documentos no configurado', 500, 'SERVICE_NOT_CONFIGURED')
    }

    const accessToken = getAccessToken(cookieStore)
    const queryString = new URLSearchParams({
      page: params.page!.toString(),
      limit: params.limit!.toString()
    }).toString()

    const { response, data } = await makeDocumentsRequest(
      `${DOCUMENTS_ENDPOINTS.BASE}?${queryString}`,
      'GET',
      undefined,
      {
        'Authorization': `Bearer ${accessToken}`
      }
    )

    if (response.ok) {
      return createDocumentsSuccessResponse(data)
    }

    const errorInfo = extractDocumentsErrorInfo(data, response, DOCUMENTS_ENDPOINTS.BASE)
    return createDocumentsErrorResponse(
      errorInfo.error,
      errorInfo.status,
      errorInfo.code,
      errorInfo.details,
      errorInfo.url
    )

  } catch (error) {
    return handleDocumentsError(error, DOCUMENTS_ENDPOINTS.BASE)
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    
    // Validar autenticación
    const authError = validateAuth(cookieStore)
    if (authError) {
      return createDocumentsErrorResponse(authError, 401, 'MISSING_TOKEN')
    }

    // Obtener el archivo del FormData
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return createDocumentsErrorResponse('No se proporcionó ningún archivo', 400, 'MISSING_FILE')
    }

    // Subir documento al microservicio
    if (!DOCUMENTS_BASE) {
      return createDocumentsErrorResponse('Microservicio de documentos no configurado', 500, 'SERVICE_NOT_CONFIGURED')
    }

    const accessToken = getAccessToken(cookieStore)
    
    // Crear FormData para el microservicio
    const microserviceFormData = new FormData()
    microserviceFormData.append('file', file)
    
    const response = await fetch(`${DOCUMENTS_BASE}${DOCUMENTS_ENDPOINTS.BASE}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: microserviceFormData
    })

    if (response.ok) {
      // Verificar si la respuesta es JSON
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json()
          return createDocumentsSuccessResponse(data)
        } catch (jsonError) {
          return createDocumentsErrorResponse(
            'Respuesta inválida del microservicio',
            response.status,
            'INVALID_RESPONSE',
            'El servidor devolvió contenido que no es JSON válido',
            `${DOCUMENTS_BASE}${DOCUMENTS_ENDPOINTS.BASE}`
          )
        }
      } else {
        return createDocumentsErrorResponse(
          'Microservicio no disponible',
          response.status,
          'SERVICE_UNAVAILABLE',
          `El servidor devolvió: ${response.status} ${response.statusText}`,
          `${DOCUMENTS_BASE}${DOCUMENTS_ENDPOINTS.BASE}`
        )
      }
    }

    // Manejar errores de respuesta
    const contentType = response.headers.get('content-type')
    let errorData: any = { error: 'Error al subir documento' }

    if (contentType && contentType.includes('application/json')) {
      try {
        errorData = await response.json()
      } catch (jsonError) {
        // Si falla el parsing JSON, usar error por defecto
        errorData = { 
          error: 'Error al subir documento',
          details: 'Respuesta inválida del servidor'
        }
      }
    } else {
      // Si no es JSON, obtener el texto de la respuesta
      try {
        const textResponse = await response.text()
        errorData = {
          error: 'Error al subir documento',
          details: `Servidor devolvió: ${response.status} ${response.statusText}`,
          response: textResponse.substring(0, 200)
        }
      } catch (textError) {
        errorData = {
          error: 'Error al subir documento',
          details: `Servidor devolvió: ${response.status} ${response.statusText}`
        }
      }
    }

    return createDocumentsErrorResponse(
      errorData.error || 'Error al subir documento',
      response.status,
      'UPLOAD_ERROR',
      errorData.details || `HTTP ${response.status}: ${response.statusText}`,
      `${DOCUMENTS_BASE}${DOCUMENTS_ENDPOINTS.BASE}`
    )

  } catch (error) {
    return handleDocumentsError(error, DOCUMENTS_ENDPOINTS.BASE)
  }
}

export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies()
    
    // Validar autenticación
    const authError = validateAuth(cookieStore)
    if (authError) {
      return createDocumentsErrorResponse(authError, 401, 'MISSING_TOKEN')
    }

    // Eliminar todos los documentos del microservicio
    if (!DOCUMENTS_BASE) {
      return createDocumentsErrorResponse('Microservicio de documentos no configurado', 500, 'SERVICE_NOT_CONFIGURED')
    }

    const accessToken = getAccessToken(cookieStore)
    
    const { response, data } = await makeDocumentsRequest(
      `${DOCUMENTS_ENDPOINTS.BASE}/user/delete-all`,
      'DELETE',
      undefined,
      {
        'Authorization': `Bearer ${accessToken}`
      }
    )

    if (response.ok) {
      return createDocumentsSuccessResponse(data)
    }

    const errorInfo = extractDocumentsErrorInfo(data, response, DOCUMENTS_ENDPOINTS.BASE)
    return createDocumentsErrorResponse(
      errorInfo.error,
      errorInfo.status,
      errorInfo.code,
      errorInfo.details,
      errorInfo.url
    )

  } catch (error) {
    return handleDocumentsError(error, DOCUMENTS_ENDPOINTS.BASE)
  }
}

