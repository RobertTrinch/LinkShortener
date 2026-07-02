let API_BASE_URL = 'https://go.trinch.net'

if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  API_BASE_URL = 'https://localhost:7113'
}

// Helper to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
//TODO: comment it properly
export interface FetchResponse<T> {
  data?: T
  status: number
  ok: boolean
  statusMessage?: string
}

interface ProblemDetails {
  status?: number
  title?: string
  detail?: string
}

interface RequestOptions {
  headers?: HeadersInit
  body?: unknown
  retry?: boolean,
  next?: { revalidate?: number; }
  cookieHeader?: string
}

async function doRequest<T>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<FetchResponse<T>> {
  const {
    body,
    headers = {},
    retry = true,
    next: nextFetchOptions, // get 'next' from options
    cookieHeader, // for passing cookies manually - needed for server-side requests
  } = options

  const MAX_RETRIES = 3
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`🔗 ${method} ${API_BASE_URL}${endpoint} (attempt ${attempt + 1})`)

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader !== undefined ? { Cookie: cookieHeader } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...(nextFetchOptions !== undefined && { next: nextFetchOptions }),
      })

      // 🛑 Unauthorized? Time to refresh & retry ONCE
      if (res.status === 401 && retry) {
        console.warn('401 detected. Attempting refresh...')

        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/RefreshToken`, {
          method: 'POST',
          credentials: 'include',
        })

        if (refreshRes.ok) {
          console.log('Refresh successful! Retrying request...')
          return doRequest<T>(method, endpoint, {
            body,
            headers,
            retry: false,
          })
        } else {
          console.error('Refresh failed. Logging out...')
          // Only clear cookies and redirect in browser environment
          if (isBrowser) {
            document.cookie = 'accessToken=; Max-Age=0; path=/'
            document.cookie = 'refreshToken=; Max-Age=0; path=/'
            // Use setTimeout to avoid blocking the request
          }
          return {
            data: undefined,
            status: 401,
            ok: false,
            statusMessage: 'Session expired. Please log in again.'
          }
        }
      }

      let data: T | undefined = undefined
      let statusMessage: string | undefined = undefined

      // if response is not ok, attempt to parse ProblemDetails JSON
      if (!res.ok) {
        try {
          const text = await res.text()
          if (text) {
            const problemDetails: ProblemDetails = JSON.parse(text)
            statusMessage = problemDetails.detail || problemDetails.title || text
          }
        } catch {
          // Response was not JSON, use raw text as fallback
        }
      } else {
        try {
          const text = await res.text()
          if (text !== '') {
            const parsed = JSON.parse(text)
            data = parsed
          }
        } catch {
          console.warn('⚠️ Failed to parse JSON response')
        }
      }

      return {
        data,
        status: res.status,
        ok: res.ok,
        statusMessage: statusMessage
      }
    } catch (error) {
      console.error(`Error in doRequest (attempt ${attempt + 1}):`, error)
      attempt++
      if (attempt >= MAX_RETRIES) {
        return {
          data: undefined,
          status: 500,
          ok: false,
        }
      }
    }
  }
  // Should not reach here, but just in case
  return {
    data: undefined,
    status: 500,
    ok: false,
  }
}

export const doGet = <T>(endpoint: string, options?: RequestOptions) =>
  doRequest<T>('GET', endpoint, options)

export const doPost = <T>(endpoint: string, options?: RequestOptions) =>
  doRequest<T>('POST', endpoint, options)

export const doPut = <T>(endpoint: string, options?: RequestOptions) =>
  doRequest<T>('PUT', endpoint, options)

export const doPatch = <T>(endpoint: string, options?: RequestOptions) =>
  doRequest<T>('PATCH', endpoint, options)

export const doDelete = <T>(endpoint: string, options?: RequestOptions) =>
  doRequest<T>('DELETE', endpoint, options)

// react query fetching
export async function doQueryGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const res: FetchResponse<T> = await doGet<T>(endpoint, options)

  if (!res.ok) {
    throw new Error(res.statusMessage ?? `Failed to fetch: ${endpoint}`)
  }

  return res.data as T
}

// Helper for downloading files as blobs
export async function doGetBlob(endpoint: string, options?: RequestOptions): Promise<Blob> {
  const {
    headers = {},
    retry = true,
    cookieHeader,
  } = options || {}

  const MAX_RETRIES = 3
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`🔗 GET (Blob) ${API_BASE_URL}${endpoint} (attempt ${attempt + 1})`)

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...(cookieHeader !== undefined ? { Cookie: cookieHeader } : {}),
          ...headers,
        },
      })

      // Handle 401 with refresh
      if (res.status === 401 && retry) {
        console.warn('401 detected. Attempting refresh...')

        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/RefreshToken`, {
          method: 'POST',
          credentials: 'include',
        })

        if (refreshRes.ok) {
          console.log('Refresh successful! Retrying request...')
          return doGetBlob(endpoint, {
            headers,
            retry: false,
          })
        } else {
          // Clear cookies and redirect to login
          if (isBrowser) {
            document.cookie = 'accessToken=; Max-Age=0; path=/'
            document.cookie = 'refreshToken=; Max-Age=0; path=/'
            setTimeout(() => {
              window.location.href = '/login'
            }, 100)
          }
          throw new Error('Session expired. Please log in again.')
        }
      }

      if (!res.ok) {
        const text = await res.text()
        let errorMessage = text || 'Failed to download file'
        try {
          const problemDetails: ProblemDetails = JSON.parse(text)
          errorMessage = problemDetails.detail || problemDetails.title || errorMessage
        } catch {
          // Response was not JSON
        }
        throw new Error(errorMessage)
      }

      return await res.blob()
    } catch (error) {
      console.error(`Error in doGetBlob (attempt ${attempt + 1}):`, error)
      attempt++
      if (attempt >= MAX_RETRIES) {
        throw error
      }
    }
  }

  throw new Error('Failed to download file after retries')
}

// Helper for uploading files with FormData
export async function doPostFormData<T>(
  endpoint: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<FetchResponse<T>> {
  const {
    headers = {},
    retry = true,
    next: nextFetchOptions,
    cookieHeader,
  } = options

  const MAX_RETRIES = 3
  let attempt = 0

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`🔗 POST (FormData) ${API_BASE_URL}${endpoint} (attempt ${attempt + 1})`)

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          // Don't set Content-Type for FormData - browser will set it with boundary
          ...(cookieHeader !== undefined ? { Cookie: cookieHeader } : {}),
          ...headers,
        },
        body: formData,
        ...(nextFetchOptions !== undefined && { next: nextFetchOptions }),
      })

      // Handle 401 with refresh
      if (res.status === 401 && retry) {
        console.warn('401 detected. Attempting refresh...')

        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/RefreshToken`, {
          method: 'POST',
          credentials: 'include',
        })

        if (refreshRes.ok) {
          console.log('Refresh successful! Retrying request...')
          return doPostFormData<T>(endpoint, formData, {
            headers,
            retry: false,
          })
        } else {
          console.error('Refresh failed.')
          if (isBrowser) {
            document.cookie = 'accessToken=; Max-Age=0; path=/'
            document.cookie = 'refreshToken=; Max-Age=0; path=/'
          }
          return {
            data: undefined,
            status: 401,
            ok: false,
            statusMessage: 'Session expired. Please log in again.'
          }
        }
      }

      let data: T | undefined = undefined
      let statusMessage: string | undefined = undefined

      if (!res.ok) {
        try {
          const text = await res.text()
          if (text) {
            const problemDetails: ProblemDetails = JSON.parse(text)
            statusMessage = problemDetails.detail || problemDetails.title || text
          }
        } catch {
          // Response was not JSON
        }
      } else {
        try {
          const text = await res.text()
          if (text !== '') {
            const parsed = JSON.parse(text)
            data = parsed
          }
        } catch {
          console.warn('⚠️ Failed to parse JSON response')
        }
      }

      return {
        data,
        status: res.status,
        ok: res.ok,
        statusMessage: statusMessage
      }
    } catch (error) {
      console.error(`Error in doPostFormData (attempt ${attempt + 1}):`, error)
      attempt++
      if (attempt >= MAX_RETRIES) {
        return {
          data: undefined,
          status: 500,
          ok: false,
        }
      }
    }
  }

  return {
    data: undefined,
    status: 500,
    ok: false,
  }
}