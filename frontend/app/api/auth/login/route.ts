import cookie from 'cookie'
import { 
  validateLoginFields, 
  makeAuthRequest, 
  extractErrorInfo, 
  createErrorResponse, 
  handleAuthError 
} from '@/lib/auth-utils'
import { AUTH_ENDPOINTS, COOKIE_CONFIG } from '@/lib/api-constants'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const validationError = validateLoginFields(body)
    if (validationError) {
      return createErrorResponse(validationError, 400, 'VALIDATION_ERROR')
    }

    const { response, data } = await makeAuthRequest(AUTH_ENDPOINTS.LOGIN, 'POST', body)

    if (!response.ok) {
      const errorInfo = extractErrorInfo(data, response, AUTH_ENDPOINTS.LOGIN)
      return createErrorResponse(
        errorInfo.error,
        errorInfo.status,
        errorInfo.code,
        errorInfo.details,
        errorInfo.url
      )
    }

    const { access_token, expires_in, refresh_token, token_type } = data
    const headers = new Headers({ 'Content-Type': 'application/json' })

    if (access_token) {
      const accessMaxAge = Number.isFinite(expires_in) && expires_in > 0 
        ? expires_in 
        : COOKIE_CONFIG.ACCESS_TOKEN.maxAge

      const serializedAccess = cookie.serialize(COOKIE_CONFIG.ACCESS_TOKEN.name, access_token, {
        ...COOKIE_CONFIG.ACCESS_TOKEN,
        maxAge: accessMaxAge,
      })
      headers.append('Set-Cookie', serializedAccess)
    }

    if (refresh_token) {
      const serializedRefresh = cookie.serialize(COOKIE_CONFIG.REFRESH_TOKEN.name, refresh_token, COOKIE_CONFIG.REFRESH_TOKEN)
      headers.append('Set-Cookie', serializedRefresh)
    }

    return new Response(JSON.stringify({ 
      ...data, 
      token_type: token_type || 'Bearer' 
    }), { 
      status: response.status, 
      headers 
    })

  } catch (err: any) {
    return handleAuthError(err, AUTH_ENDPOINTS.LOGIN)
  }
}