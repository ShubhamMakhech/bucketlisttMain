import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const otpArr = otp.split('')
    otpArr[index] = value
    setOtp(otpArr.join(''))
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const resetState = () => {
    setEmail('')
    setOtp('')
    setNewPassword('')
    setLoading(false)
    setError(null)
    setStep('email')
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: sendData, error: sendError } = await supabase.functions.invoke('send-password-reset', {
        body: { email },
      })
      if (sendError) throw new Error(sendError.message)
      toast({ title: 'OTP Sent', description: 'Check your email for the OTP.' })
      setStep('verify')
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-password-reset', {
        body: { email, otp, newPassword },
      })
      if (verifyError) {
        setError(verifyError.message)
        setLoading(false)
        return
      }
      toast({ title: 'Success', description: 'Password has been reset.' })
      resetState()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetState}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            {step === 'email' ? 'Forgot your password?' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {step === 'email'
              ? 'Enter your email address and we\'ll send you a one-time password (OTP) to reset your password.'
              : 'Enter the 6-digit OTP sent to your email and your new password.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetState}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={loading || !email}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>OTP</Label>
                <div className="flex space-x-2">
                  {[...Array(6)].map((_, i) => (
                    <Input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-10 h-10 text-center"
                      value={otp[i] || ''}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      ref={(el) => (inputRefs.current[i] = el)}
                      required
                    />
                  ))}
                </div>
+               {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetState}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={loading || !otp || !newPassword}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}