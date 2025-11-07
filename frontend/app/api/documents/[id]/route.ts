import { cookies } from 'next/headers'
import { 
  DOCUMENTS_BASE,
  createDocumentsErrorResponse,
  createDocumentsSuccessResponse,
  handleDocumentsError,
  validateAuth,
  getAccessToken,
  makeDocumentsRequest,
  extractDocumentsErrorInfo
} from '@/lib/documents-utils'
import { DOCUMENTS_ENDPOINTS } from '@/lib/api-constants'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const cookieStore = await cookies()
    
    const authError = validateAuth(cookieStore)
    if (authError) {
      return createDocumentsErrorResponse(authError, 401, 'MISSING_TOKEN')
    }

    const documentId = resolvedParams.id
    if (!documentId) {
      return createDocumentsErrorResponse('ID de documento requerido', 400, 'MISSING_DOCUMENT_ID')
    }

    if (!DOCUMENTS_BASE) {
      return createDocumentsErrorResponse('Microservicio de documentos no configurado', 500, 'SERVICE_NOT_CONFIGURED')
    }

    const accessToken = getAccessToken(cookieStore)
    
    const { response, data } = await makeDocumentsRequest(
      `${DOCUMENTS_ENDPOINTS.BASE}/${documentId}`,
      'GET',
      undefined,
      {
        'Authorization': `Bearer ${accessToken}`
      }
    )

    if (response.ok) {
      return createDocumentsSuccessResponse(data)
    }
    console.log(response)

    const errorInfo = extractDocumentsErrorInfo(data, response, `${DOCUMENTS_ENDPOINTS.BASE}/${documentId}`)
    return createDocumentsErrorResponse(
      errorInfo.error,
      errorInfo.status,
      errorInfo.code,
      errorInfo.details,
      errorInfo.url
    )

  } catch (error) {
    const resolvedParams = await params
    return handleDocumentsError(error, `${DOCUMENTS_ENDPOINTS.BASE}/${resolvedParams.id}`)
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const cookieStore = await cookies()
    
    const authError = validateAuth(cookieStore)
    if (authError) {
      return createDocumentsErrorResponse(authError, 401, 'MISSING_TOKEN')
    }

    const documentId = resolvedParams.id
    if (!documentId) {
      return createDocumentsErrorResponse('ID de documento requerido', 400, 'MISSING_DOCUMENT_ID')
    }

    if (!DOCUMENTS_BASE) {
      return createDocumentsErrorResponse('Microservicio de documentos no configurado', 500, 'SERVICE_NOT_CONFIGURED')
    }

    const accessToken = getAccessToken(cookieStore)
    
    const { response, data } = await makeDocumentsRequest(
      `${DOCUMENTS_ENDPOINTS.BASE}/${documentId}`,
      'DELETE',
      undefined,
      {
        'Authorization': `Bearer ${accessToken}`
      }
    )

    if (response.ok) {
      return createDocumentsSuccessResponse(data)
    }

    const errorInfo = extractDocumentsErrorInfo(data, response, `${DOCUMENTS_ENDPOINTS.BASE}/${documentId}`)
    return createDocumentsErrorResponse(
      errorInfo.error,
      errorInfo.status,
      errorInfo.code,
      errorInfo.details,
      errorInfo.url
    )

  } catch (error) {
    const resolvedParams = await params
    return handleDocumentsError(error, `${DOCUMENTS_ENDPOINTS.BASE}/${resolvedParams.id}`)
  }
}
