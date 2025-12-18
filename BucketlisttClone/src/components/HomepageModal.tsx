import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { Heart } from 'lucide-react';

const HomepageModal: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Debug and fix the modal logic
        const shouldShowModal = () => {
            // Check if this is a page reload using the most reliable method
            const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const isReload = (navigationEntry?.type as string) === 'reload';
            
            // Check if user has navigated within the app
            const hasNavigatedWithinApp = sessionStorage.getItem('hasNavigatedWithinApp') === 'true';
            
            // Debug logging
            console.log('Modal Debug:', {
                isReload,
                hasNavigatedWithinApp,
                referrer: document.referrer,
                navigationType: navigationEntry?.type
            });
            
            // Show modal ONLY if:
            // 1. It's an actual reload AND user hasn't navigated within the app, OR
            // 2. It's a fresh page load (no referrer) AND user hasn't navigated within the app
            const isFreshPageLoad = !document.referrer;
            
            if (isReload && !hasNavigatedWithinApp) {
                return true; // Show on reload if user hasn't navigated within app
            }
            
            if (isFreshPageLoad && !hasNavigatedWithinApp) {
                return true; // Show on fresh page load if user hasn't navigated within app
            }
            
            return false; // Don't show in all other cases
        };

        // Only show modal on actual page reload or fresh page load
        if (shouldShowModal()) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            // If user has navigated within the app, don't show modal
            // This prevents the modal from showing when navigating back to homepage
            console.log('Modal not showing - user has navigated within app or not a reload');
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <Modal
            title={null}
            open={isVisible}
            onCancel={handleClose}
            footer={null}
            width={520}
            centered
            // header={false}
            maskClosable={false}
            closable={false}
            className="homepage-modal"
            styles={{
                body: {
                    // padding: '32px',
                    textAlign: 'start',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    backgroundColor: '#fafafa',
                    borderRadius: '8px',
                },
                header: {
                    display: 'none',
                },
                content: {
                    borderRadius: '12px',
                },
            }}
        >
            <div className="space-y-4">
                <div className='ModalImageContainer'>
                    <img src="/Images/BucketListOwners.jpg" alt="" />
                </div>
                <div className=" font-semibold text-gray-800 leading-relaxed" style={{fontSize: '18px'}}>
                    We travel enthu school time friends are building
                    {/* <br /> */}&nbsp;
                    <span className="font-bold text-orange-600">bucketlistt.com</span> to give you the
                    &nbsp;
                    <span className="bg-purple-200 px-3 py-1 rounded-full font-bold text-purple-800">
                        Real
                    </span>&nbsp;
                    and{' '}
                    <span className="bg-purple-200 px-3 py-1 rounded-full font-bold text-purple-800">
                        Authentic
                    </span>{' '}
                    experiences
                </div>

                <div className="font-semibold text-gray-700 ">
                    Hope you love your experiences with us!
                </div>

                <div className="flex items-center gap-1 text-gray-700 ">
                    <span className='font-semibold'>With Love</span>
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                    <span>,</span>
                </div>

                <div className="text-gray-800 font-semibold" style={{marginTop: '0px'}}>
                    CA Shubham (AIR 36) &<br />
                    CA Nitant
                </div>

                <Button
                    type="primary"
                    size="large"
                    onClick={handleClose}
                    className="w-full bg-orange-500 hover:bg-orange-600 hover:border-orange-600 h-12 text-lg font-medium"
                >
                    Start Exploring!
                </Button>
            </div>
        </Modal>
    );
};

export default HomepageModal;
