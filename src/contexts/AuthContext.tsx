import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (data: SignUpData) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
}

interface SignUpData {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber: string
  role: 'customer' | 'vendor'
  termsAccepted: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected')
        }
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (data: SignUpData) => {
    // Check if user already exists using secure Edge Function
    try {
      const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-user-exists', {
        body: { email: data.email.trim() }
      });
      
      if (checkError) {
        return { error: { message: 'Failed to validate email. Please try again.' } }
      }
      
      if (checkResult?.userExists) {
        return {
          error: {
            message: 'User already registered',
            code: 'user_already_exists'
          }
        }
      }
    } catch (error) {
      return { error: { message: 'Failed to validate email. Please try again.' } }
    }

    const redirectUrl = `https://www.bucketlistt.com/auth`
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: data.phoneNumber,
          role: data.role,
          terms_accepted: data.termsAccepted,
        }
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const redirectUrl = `https://www.bucketlistt.com/auth?mode=reset`
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    return { error }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { error }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
