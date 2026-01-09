/**
 * @file Authentication middleware for API routes
 * Uses Supabase Auth to verify requests
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export interface AuthUser {
  id: string
  email?: string
}

export interface AuthResult {
  user: AuthUser | null
  error: string | null
}

/**
 * Get the authenticated user from the request
 * Returns null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<AuthResult> {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { user: null, error: error?.message || 'Not authenticated' }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
      },
      error: null,
    }
  } catch (error) {
    console.error('Auth error:', error)
    return { user: null, error: 'Authentication failed' }
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const { user, error } = await getAuthUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    )
  }
  
  return user
}

/**
 * Check if user owns a model
 */
export async function requireModelOwnership(
  request: NextRequest,
  modelId: string
): Promise<AuthUser | NextResponse> {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  // For now, we'll skip ownership check until we add user_id to models table
  // TODO: Add ownership check once models table has user_id column
  // const { data: model } = await supabase
  //   .from('models')
  //   .select('user_id')
  //   .eq('id', modelId)
  //   .single()
  // 
  // if (!model || model.user_id !== authResult.id) {
  //   return NextResponse.json(
  //     { error: 'You do not have access to this model' },
  //     { status: 403 }
  //   )
  // }
  
  return authResult
}

/**
 * Optional auth - returns user if authenticated, null otherwise
 * Does not return error response
 */
export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  const { user } = await getAuthUser(request)
  return user
}

