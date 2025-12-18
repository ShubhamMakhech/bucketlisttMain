import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface ForgotPasswordFormProps {
    onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
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
            onBack()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    {/* <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button> */}
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-orange-500" />
                            {step === 'email' ? 'Forgot your password?' : 'Reset Password'}
                        </CardTitle>
                        <CardDescription>
                            {step === 'email'
                                ? 'Enter your email address and we\'ll send you a one-time password (OTP) to reset your password.'
                                : 'Enter the 6-digit OTP sent to your email and your new password.'
                            }
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            {step === 'email' ? (
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
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
                    </CardContent>
          <div className="px-6 pb-6 space-y-3">
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading || !email}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
            >
              Back to Sign In
            </Button>
          </div>
                </form>
            ) : (
                <form onSubmit={handleVerify}>
                    <CardContent className="space-y-4">
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
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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
                    </CardContent>
          <div className="px-6 pb-6 space-y-3">
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={loading || !otp || !newPassword}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
            >
              Back to Sign In
            </Button>
          </div>
                </form>
            )}
        </Card>
    )
}
