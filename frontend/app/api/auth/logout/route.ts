import cookie from 'cookie'
import { AUTH_BASE, createErrorResponse, extractErrorInfo, handleAuthError, makeAuthRequest } from '@/lib/auth-utils'
import { AUTH_ENDPOINTS, COOKIE_CONFIG } from '@/lib/api-constants'

export async function POST(req: Request) {
  try {
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header)
    const accessToken = parsed[COOKIE_CONFIG.ACCESS_TOKEN.name] || parsed.token || ''
    const refreshToken = parsed[COOKIE_CONFIG.REFRESH_TOKEN.name] || ''

    let microserviceResponse: any = { message: 'logged out' }

    if (AUTH_BASE) {
      try {
        const { response, data } = await makeAuthRequest(AUTH_ENDPOINTS.LOGOUT, 'POST', { refresh_token: refreshToken }, {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        })

        if (!response.ok) {
          const errorInfo = extractErrorInfo(data, response, AUTH_ENDPOINTS.LOGOUT)
          return createErrorResponse(
            errorInfo.error,
            errorInfo.status,
            errorInfo.code,
            errorInfo.details,
            errorInfo.url
          )
        }

        microserviceResponse = data || { message: 'logged out' }
      } catch (e: any) {
        return handleAuthError(e, AUTH_ENDPOINTS.LOGOUT)
      }
    }

    const headers = new Headers({ 'Content-Type': 'application/json' })

    const clearAccess = cookie.serialize(COOKIE_CONFIG.ACCESS_TOKEN.name, '', {
      ...COOKIE_CONFIG.ACCESS_TOKEN,
      maxAge: 0,
    })

    const clearRefresh = cookie.serialize(COOKIE_CONFIG.REFRESH_TOKEN.name, '', {
      ...COOKIE_CONFIG.REFRESH_TOKEN,
      maxAge: 0,
    })

    headers.append('Set-Cookie', clearAccess)
    headers.append('Set-Cookie', clearRefresh)

    return new Response(JSON.stringify(microserviceResponse), {
      status: 200,
      headers
    })

  } catch (err: any) {
    return createErrorResponse(
      err?.message || 'Error logging out',
      500,
      'LOGOUT_ERROR'
    )
  }
}