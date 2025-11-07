import { 
  validateRegistrationFields, 
  makeAuthRequest, 
  extractErrorInfo, 
  createErrorResponse, 
  createSuccessResponse, 
  handleAuthError 
} from '@/lib/auth-utils'
import { AUTH_ENDPOINTS } from '@/lib/api-constants'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const validationError = validateRegistrationFields(body)
    if (validationError) {
      return createErrorResponse(validationError, 400, 'VALIDATION_ERROR')
    }
    
    const { response, data } = await makeAuthRequest(AUTH_ENDPOINTS.REGISTER, 'POST', body)

    if (!response.ok) {
      const errorInfo = extractErrorInfo(data, response, AUTH_ENDPOINTS.REGISTER)
      return createErrorResponse(
        errorInfo.error,
        errorInfo.status,
        errorInfo.code,
        errorInfo.details,
        errorInfo.url
      )
    }

    return createSuccessResponse(data, 200)

  } catch (err: any) {
    return handleAuthError(err, AUTH_ENDPOINTS.REGISTER)
  }
}