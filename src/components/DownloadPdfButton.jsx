import React, { useState } from 'react';
import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { message } from 'antd';

// Dynamic import for html2pdf
let html2pdf;

const DownloadPdfButton = ({ invoiceRef, fileName = 'Booking_Invoice' }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownloadPDF = async () => {
        try {
            setDownloading(true);
            message.loading({
                content: 'Generating PDF...',
                key: 'pdf-download',
                duration: 0,
            });

            // Dynamically import dependencies
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            // Wait a bit to ensure content is rendered
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Get the original invoice element
            const originalElement = invoiceRef?.current;

            if (!originalElement) {
                message.error({
                    content: 'Invoice content not found. Please try again.',
                    key: 'pdf-download',
                    duration: 5,
                });
                setDownloading(false);
                return;
            }

            // 1. CLONE THE ELEMENT
            const element = originalElement.cloneNode(true);

            // 2. STYLE THE CLONE - keep it EXACTLY as preview
            element.style.width = '700px';
            element.style.height = 'auto';
            element.style.minHeight = '1080px';

            // Position for rendering (must be visible to html2canvas)
            element.style.position = 'absolute';
            element.style.top = '0px';
            element.style.left = '0px';
            element.style.zIndex = '-9999';
            element.style.background = 'white';
            element.style.margin = '0';
            element.style.transform = 'none';

            // Hide the download button inside the clone
            const downloadBtnInClone =
                element.querySelector('[data-pdf-button]') ||
                element.querySelector('button[class*="ant-btn"]');
            if (downloadBtnInClone) {
                downloadBtnInClone.style.display = 'none';
            }

            // 3. APPEND TO BODY
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '0';
            container.style.height = '0';
            container.style.overflow = 'visible';
            container.style.zIndex = '-9999';

            container.appendChild(element);
            document.body.appendChild(container);

            // Wait for images to load
            await new Promise((resolve) => {
                const images = element.querySelectorAll('img');
                let loadedCount = 0;
                const totalImages = images.length;

                if (totalImages === 0) {
                    resolve();
                    return;
                }

                images.forEach((img) => {
                    if (img.complete) {
                        loadedCount++;
                        if (loadedCount === totalImages) resolve();
                    } else {
                        img.onload = () => {
                            loadedCount++;
                            if (loadedCount === totalImages) resolve();
                        };
                        img.onerror = () => {
                            loadedCount++;
                            if (loadedCount === totalImages) resolve();
                        };
                    }
                });

                setTimeout(resolve, 3000);
            });

            // 4. CAPTURE ELEMENT AS IMAGE using html2canvas
            // Scale 2 = high quality (2x resolution)
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                width: 700,
                height: element.scrollHeight,
                windowWidth: 700,
                windowHeight: element.scrollHeight
            });

            // 5. CREATE PDF AND ADD IMAGE
            // A4 = 210mm x 297mm
            // We'll fit the 700px width to ~190mm (10mm margins on sides)
            const imgData = canvas.toDataURL('image/jpeg', 0.95);

            const doc = new jsPDF({
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            });

            // Calculate dimensions to fit on A4
            const pageWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const marginX = 10; // 10mm side margins
            const marginY = 10; // 10mm top/bottom margins

            const maxWidth = pageWidth - (2 * marginX); // 190mm
            const maxHeight = pageHeight - (2 * marginY); // 277mm

            // Calculate image dimensions in mm
            // 700px at 96 DPI = 700 * 25.4 / 96 = ~185mm
            const imgWidthMM = maxWidth; // Use full available width
            const imgHeightMM = (canvas.height / canvas.width) * imgWidthMM;

            // Check if height fits on one page
            if (imgHeightMM <= maxHeight) {
                // Fits on one page - add with margins
                doc.addImage(imgData, 'JPEG', marginX, marginY, imgWidthMM, imgHeightMM);
            } else {
                // Slightly too tall - scale down to fit
                const scaleFactor = maxHeight / imgHeightMM;
                const finalWidth = imgWidthMM * scaleFactor;
                const finalHeight = maxHeight;
                const centerX = (pageWidth - finalWidth) / 2;
                doc.addImage(imgData, 'JPEG', centerX, marginY, finalWidth, finalHeight);
            }

            // 6. ADD CLICKABLE LINKS using pdf-lib
            // Import pdf-lib
            const { PDFDocument, PDFName, PDFString } = await import('pdf-lib');

            // Convert to PDFDocument for link manipulation
            const pdfBytes = doc.output('arraybuffer');
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();

            // Find all links in the element
            const links = element.querySelectorAll('a[href]');

            if (links.length > 0) {
                // Calculate the actual image position and size on the PDF
                let actualImgX, actualImgY, actualImgWidth, actualImgHeight;

                if (imgHeightMM <= maxHeight) {
                    // Image fits - positioned at margins
                    actualImgX = marginX;
                    actualImgY = marginY;
                    actualImgWidth = imgWidthMM;
                    actualImgHeight = imgHeightMM;
                } else {
                    // Image was scaled down
                    const scaleFactor = maxHeight / imgHeightMM;
                    actualImgWidth = imgWidthMM * scaleFactor;
                    actualImgHeight = maxHeight;
                    actualImgX = (pageWidth - actualImgWidth) / 2;
                    actualImgY = marginY;
                }

                // Convert mm to points (1mm = 2.83465pt)
                const imgXPt = actualImgX * 2.83465;
                const imgYPt = actualImgY * 2.83465;
                const imgWidthPt = actualImgWidth * 2.83465;
                const imgHeightPt = actualImgHeight * 2.83465;

                // Scale factors from element pixels to PDF points
                const scaleX = imgWidthPt / 700; // 700px element width
                const scaleY = imgHeightPt / element.scrollHeight;

                links.forEach((link) => {
                    try {
                        const href = link.getAttribute('href');
                        if (!href) return;

                        // Get link position relative to element
                        const rect = link.getBoundingClientRect();
                        const elemRect = element.getBoundingClientRect();

                        const relX = rect.left - elemRect.left;
                        const relY = rect.top - elemRect.top;
                        const linkWidth = rect.width;
                        const linkHeight = rect.height;

                        // Convert to PDF coordinates
                        // PDF Y is measured from bottom, so we need to flip it
                        const pdfX = imgXPt + (relX * scaleX);
                        const pdfYFromBottom = pdfHeight - (imgYPt + ((relY + linkHeight) * scaleY));

                        const scaledWidth = linkWidth * scaleX;
                        const scaledHeight = linkHeight * scaleY;

                        // Add link annotation
                        firstPage.drawRectangle({
                            x: pdfX,
                            y: pdfYFromBottom,
                            width: scaledWidth,
                            height: scaledHeight,
                            borderWidth: 0,
                            opacity: 0,
                        });

                        // Note: pdf-lib doesn't have a simple way to add URI links
                        // We need to manually create the annotation with iOS compatibility
                        const annotation = pdfDoc.context.obj({
                            Type: 'Annot',
                            Subtype: 'Link',
                            Rect: [pdfX, pdfYFromBottom, pdfX + scaledWidth, pdfYFromBottom + scaledHeight],
                            Border: [0, 0, 0],
                            F: 4, // Flags: 4 = Print (required for iOS)
                            H: PDFName.of('I'), // Highlight mode: Invert (visual feedback on click)
                            A: {
                                Type: 'Action',
                                S: 'URI',
                                URI: PDFString.of(href) // Use PDFString for better compatibility
                            }
                        });

                        const annotationRef = pdfDoc.context.register(annotation);
                        const annots = firstPage.node.lookup(PDFName.of('Annots'));
                        if (annots) {
                            annots.push(annotationRef);
                        } else {
                            firstPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([annotationRef]));
                        }
                    } catch (linkError) {
                        console.warn('Failed to add link annotation:', linkError);
                    }
                });
            }

            // Save the modified PDF
            const finalPdfBytes = await pdfDoc.save();
            const finalBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });

            // 7. DOWNLOAD THE PDF
            const url = URL.createObjectURL(finalBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // CLEAN UP
            document.body.removeChild(container);

            message.success({
                content: 'PDF downloaded successfully!',
                key: 'pdf-download',
                duration: 3,
            });

        } catch (error) {
            console.error('PDF Download Error:', error);
            message.error({
                content: error?.message || 'Failed to generate PDF. Please try again.',
                key: 'pdf-download',
                duration: 5,
            });
            // Try to cleanup in case of error
            const container = document.body.querySelector('div[style*="z-index: -9999"]');
            if (container) document.body.removeChild(container);
        } finally {
            setDownloading(false);
        }
    };


    return (
        <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadPDF}
            loading={downloading}
            disabled={downloading}
            size="small"
            data-pdf-button="true"
            style={{
                flexShrink: 0,
            }}
        >
            {downloading ? 'Generating...' : 'Download PDF'}
        </Button>
    );
};

export default DownloadPdfButton;

