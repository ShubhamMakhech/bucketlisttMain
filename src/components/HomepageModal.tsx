import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { Heart } from 'lucide-react';

const HomepageModal: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if this is a page reload (not navigation)
        const isPageReload = performance.navigation.type === 1 ||
            performance.getEntriesByType('navigation')[0]?.type === 'reload' ||
            window.performance.getEntriesByType('navigation')[0]?.type === 'reload';

        // Only show modal on page reload, not on navigation
        if (isPageReload) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000); // Show after 1 second

            return () => clearTimeout(timer);
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
