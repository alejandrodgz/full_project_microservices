import cookie from 'cookie'
import { 
  createErrorResponse, 
  makeAuthRequest, 
  extractErrorInfo, 
  handleAuthError 
} from '@/lib/auth-utils'
import { AUTH_ENDPOINTS, COOKIE_CONFIG } from '@/lib/api-constants'

export async function POST(req: Request) {
  try {
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header)
    const refreshToken = parsed[COOKIE_CONFIG.REFRESH_TOKEN.name]

    if (!refreshToken) {
      return createErrorResponse('No refresh token', 401, 'MISSING_REFRESH_TOKEN')
    }

    const { response, data } = await makeAuthRequest(AUTH_ENDPOINTS.REFRESH, 'POST', {
      refresh_token: refreshToken
    })

    if (!response.ok) {
      const errorInfo = extractErrorInfo(data, response, AUTH_ENDPOINTS.REFRESH)
      return createErrorResponse(
        errorInfo.error,
        errorInfo.status,
        errorInfo.code,
        errorInfo.details,
        errorInfo.url
      )
    }

    const { access_token, expires_in, refresh_token: newRefreshToken, token_type } = data
    
    return handleSuccessfulRefresh({
      access_token,
      expires_in,
      refresh_token: newRefreshToken || refreshToken,
      token_type
    })

  } catch (err: any) {
    return handleAuthError(err, AUTH_ENDPOINTS.REFRESH)
  }
}

function handleSuccessfulRefresh(data: any) {
  const { access_token, expires_in, refresh_token } = data
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

  return new Response(JSON.stringify(data), { 
    status: 200, 
    headers 
  })
}