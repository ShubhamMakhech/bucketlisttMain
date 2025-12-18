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
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08);
    padding: 0;
    background: #ffffff;
  }
  .auth-modal .ant-modal-header {
    display: none;
  }
  .auth-modal .ant-modal-body {
    padding: 0;
  }
  .auth-modal .ant-modal-close {
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
    z-index: 10;
  }
  .auth-modal .ant-modal-close:hover {
    background: rgba(0, 0, 0, 0.08);
    transform: scale(1.05);
  }
  .auth-modal .ant-modal-close-x {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 18px;
    color: rgba(0, 0, 0, 0.65);
    font-weight: 500;
  }
  .auth-modal .ant-modal-close:hover .ant-modal-close-x {
    color: rgba(0, 0, 0, 0.85);
  }
  .auth-modal .ant-modal-mask {
    background-color: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
  }
  
  /* Dark mode support */
  .dark .auth-modal .ant-modal-content {
    background: #1a1a1a;
    border-color: rgba(255, 255, 255, 0.1);
  }
  .dark .auth-modal .ant-modal-close {
    background: rgba(255, 255, 255, 0.08);
  }
  .dark .auth-modal .ant-modal-close:hover {
    background: rgba(255, 255, 255, 0.15);
  }
  .dark .auth-modal .ant-modal-close-x {
    color: rgba(255, 255, 255, 0.65);
  }
  .dark .auth-modal .ant-modal-close:hover .ant-modal-close-x {
    color: rgba(255, 255, 255, 0.85);
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
                width={520}
                centered
                className="auth-modal"
                styles={{
                    body: { padding: 0 }
                }}
            >
                <div className="bg-white dark:bg-gray-900">
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
