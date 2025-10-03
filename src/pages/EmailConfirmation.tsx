
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'

export default function EmailConfirmation() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/bucket-list-icon.png" 
            alt="bucketlistt Logo" 
            className="h-18 w-auto mx-auto" 
          />
        </div>

          <Card className="w-full shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-orange-500" />
              </div>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription className="text-center">
                We've sent you a confirmation link to verify your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please check your email and click the confirmation link to activate your account.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Don't forget to check your spam folder if you don't see the email.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline" 
                className="w-full mt-6 hover:bg-orange-50 hover:border-orange-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go back to login page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
}
