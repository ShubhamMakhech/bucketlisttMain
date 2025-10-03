
import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/hooks/useUserRole'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { VendorSignUpForm } from '@/components/auth/VendorSignUpForm'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'


// Helper function to parse URL parameters from both hash and search params
const getUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  
  const params = {
    mode: urlParams.get('mode') || hashParams.get('mode'),
    access_token: urlParams.get('access_token') || hashParams.get('access_token'),
    refresh_token: urlParams.get('refresh_token') || hashParams.get('refresh_token'),
    type: urlParams.get('type') || hashParams.get('type'),
  }
  
  return params
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [searchParams] = useSearchParams()
  const { user, loading } = useAuth()
  const { isVendor, loading: roleLoading } = useUserRole()
  const navigate = useNavigate()

  const urlParams = getUrlParams()
  const mode = searchParams.get('mode')
  const accessToken = urlParams.access_token
  const refreshToken = urlParams.refresh_token
  const type = urlParams.type
  
  const isResetMode = mode === 'reset' || type === 'recovery' || (accessToken && refreshToken && type === 'recovery')
  const isVendorMode = mode === 'vendor'

  // Set signup mode if vendor mode is detected
  useEffect(() => {
    if (isVendorMode) {
      setIsSignUp(true)
    }
  }, [isVendorMode])

  // Handle navigation after authentication
  useEffect(() => {
    if (user && !loading && !roleLoading && !isResetMode) {
      if (isVendor) {
        navigate('/profile')
      } else {
        navigate('/')
      }
    }
  }, [user, loading, roleLoading, isVendor, navigate, isResetMode])

  // Clear hash parameters when component mounts if they exist
  useEffect(() => {
    if (window.location.hash && (type === 'recovery' || accessToken)) {
      // Replace the URL to clean it up and use query parameters instead
      const cleanUrl = `${window.location.origin}${window.location.pathname}?mode=reset&access_token=${accessToken}&refresh_token=${refreshToken}&type=${type}`
      window.history.replaceState({}, '', cleanUrl)
    }
  }, [accessToken, refreshToken, type])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 to-error/5 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/bucket-list-icon.png" 
            alt="bucketlistt Logo" 
            className="h-18 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => navigate('/')}
          />
        </div>

        {isResetMode ? (
          <ResetPasswordForm />
        ) : isSignUp ? (
          isVendorMode ? (
            <VendorSignUpForm onToggleMode={() => setIsSignUp(false)} />
          ) : (
            <SignUpForm onToggleMode={() => setIsSignUp(false)} />
          )
        ) : (
          <SignInForm onToggleMode={() => setIsSignUp(true)} />
        )}
      </div>
    </div>
  )
}
