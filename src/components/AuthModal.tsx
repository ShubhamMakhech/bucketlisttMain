import React, { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/hooks/useUserRole'
import { SignInForm } from '@/components/auth/SignInForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { VendorSignUpForm } from '@/components/auth/VendorSignUpForm'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

// Custom styles for the auth modal
const modalStyles = `
  .auth-modal .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
  }
  .auth-modal .ant-modal-header {
    display: none;
  }
  .auth-modal .ant-modal-body {
    padding: 0;
  }
`

interface AuthModalProps {
    open: boolean
    onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [isVendorMode, setIsVendorMode] = useState(false)
    const [isResetMode, setIsResetMode] = useState(false)
    const [isForgotPassword, setIsForgotPassword] = useState(false)
    const { user, loading } = useAuth()
    const { isVendor, loading: roleLoading } = useUserRole()

    // Handle authentication success
    useEffect(() => {
        if (user && !loading && !roleLoading && !isResetMode) {
            onClose()
            // Reset states when modal closes
            setIsSignUp(false)
            setIsVendorMode(false)
            setIsResetMode(false)
        }
    }, [user, loading, roleLoading, isResetMode, onClose])

    const handleToggleMode = () => {
        setIsSignUp(!isSignUp)
    }

    const handleVendorMode = () => {
        setIsVendorMode(true)
        setIsSignUp(true)
    }

    const handleResetMode = () => {
        setIsResetMode(true)
    }

    const handleForgotPassword = () => {
        setIsForgotPassword(true)
    }

    const handleModalClose = () => {
        onClose()
        // Reset states when modal closes
        setIsSignUp(false)
        setIsVendorMode(false)
        setIsResetMode(false)
        setIsForgotPassword(false)
    }

    if (loading) {
        return (
            <Modal
                open={open}
                onCancel={handleModalClose}
                footer={null}
                width={400}
                centered
                className="auth-modal"
            >
                <div className="flex items-center justify-center py-8">
                    <div className="text-center">Loading...</div>
                </div>
            </Modal>
        )
    }

    return (
        <>
            <style>{modalStyles}</style>
            <Modal
                open={open}
                onCancel={handleModalClose}
                footer={null}
                width={500}
                centered
                className="auth-modal"
                styles={{
                    body: { padding: 0 }
                }}
            >
                <div className="BrandShadeCommon from-brand-primary/5 to-error/5 dark:from-neutral-900 dark:to-neutral-800">
                    {/* <div className="text-center mb-2">
                        <img
                            src="https://prepseed.s3.ap-south-1.amazonaws.com/Bucketlistt+(3).png"
                            alt="bucketlistt Logo"
                            className="h-16 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        />
                    </div> */}

                    {isResetMode ? (
                        <ResetPasswordForm />
                    ) : isForgotPassword ? (
                        <ForgotPasswordForm onBack={() => setIsForgotPassword(false)} />
                    ) : isSignUp ? (
                        isVendorMode ? (
                            <VendorSignUpForm onToggleMode={() => setIsSignUp(false)} />
                        ) : (
                            <SignUpForm
                                onToggleMode={() => setIsSignUp(false)}
                                onVendorMode={handleVendorMode}
                            />
                        )
                    ) : (
                        <SignInForm
                            onToggleMode={() => setIsSignUp(true)}
                            onResetMode={handleResetMode}
                            onForgotPassword={handleForgotPassword}
                        />
                    )}
                </div>
            </Modal>
        </>
    )
}
