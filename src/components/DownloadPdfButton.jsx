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
            message.loading({ content: 'Generating PDF...', key: 'pdf-download', duration: 0 });

            // Dynamically import html2pdf
            if (!html2pdf) {
                try {
                    const html2pdfModule = await import('html2pdf.js');
                    html2pdf = html2pdfModule.default ||
                        html2pdfModule.html2pdf ||
                        html2pdfModule ||
                        window.html2pdf;

                    if (!html2pdf && window.html2pdf) {
                        html2pdf = window.html2pdf;
                    }

                    if (!html2pdf) {
                        throw new Error('html2pdf.js module not found');
                    }
                } catch (importError) {
                    console.error('Failed to import html2pdf:', importError);
                    message.error({
                        content: 'Failed to load PDF library. Please refresh the page and try again.',
                        key: 'pdf-download',
                        duration: 5
                    });
                    setDownloading(false);
                    return;
                }
            }

            // Wait a bit to ensure content is rendered
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get the invoice element from ref
            const element = invoiceRef?.current;

            if (!element) {
                message.error({
                    content: 'Invoice content not found. Please try again.',
                    key: 'pdf-download',
                    duration: 5
                });
                setDownloading(false);
                return;
            }

            // Hide the download button in the PDF (temporarily)
            const downloadButton = element.querySelector('[data-pdf-button]') ||
                element.querySelector('button[class*="ant-btn"]');
            let originalDisplay = '';
            if (downloadButton) {
                originalDisplay = downloadButton.style.display;
                downloadButton.style.display = 'none';
            }

            // Wait for images to load
            await new Promise(resolve => {
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

                // Timeout after 5 seconds
                setTimeout(resolve, 5000);
            });

            // Get exact dimensions from the element
            const elementWidth = element.offsetWidth || 600; // Container width: 600px
            const elementHeight = element.scrollHeight || element.offsetHeight;

            // Convert pixels to mm (1px = 0.264583mm at 96 DPI)
            // Container is 600px wide, padding is 32px on sides
            const widthInMM = elementWidth * 0.264583; // ~158.75mm for 600px
            const paddingTopMM = 32 * 0.264583; // ~8.47mm
            const paddingBottomMM = 24 * 0.264583; // ~6.35mm
            const paddingSideMM = 32 * 0.264583; // ~8.47mm

            // PDF generation options - match exact layout with same width and padding
            const opt = {
                margin: [paddingTopMM, paddingSideMM, paddingBottomMM, paddingSideMM], // Match exact padding: top, right, bottom, left
                filename: `${fileName}_${new Date().getTime()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2, // Higher scale for better quality
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    letterRendering: true,
                    backgroundColor: '#ffffff',
                    windowWidth: elementWidth, // Exact width: 600px
                    windowHeight: elementHeight, // Exact height
                    width: elementWidth, // Set exact width
                    height: elementHeight, // Set exact height
                },
                jsPDF: {
                    unit: 'mm',
                    format: [widthInMM, elementHeight * 0.264583], // Custom format: exact width in mm, height in mm
                    orientation: 'portrait',
                    compress: true
                },
                pagebreak: {
                    mode: ['avoid-all', 'css', 'legacy'],
                    avoid: ['header', 'h1']
                }
            };

            // Generate PDF
            let worker;
            if (typeof html2pdf === 'function') {
                worker = html2pdf();
            } else if (html2pdf && typeof html2pdf.default === 'function') {
                worker = html2pdf.default();
            } else {
                throw new Error('html2pdf is not a valid function');
            }

            // Generate PDF as blob first (don't save yet)
            const pdfBlob = await worker.set(opt).from(element).output('blob');

            if (!pdfBlob) {
                throw new Error('Failed to generate PDF blob');
            }

            // Load PDF in pdf-lib to add clickable links
            const { PDFDocument, PDFName, PDFArray, PDFString, PDFDict } = await import('pdf-lib');
            const pdfArrayBuffer = await pdfBlob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

            // Get all pages
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();

            // Find all links in the element and add them to PDF
            const links = element.querySelectorAll('a[href]');

            if (links.length > 0) {
                // Calculate scale factor: PDF dimensions / element dimensions
                // Account for margins in the PDF (convert mm to points: 1mm = 2.83465 points)
                const marginLeft = paddingSideMM * 2.83465;
                const marginRight = paddingSideMM * 2.83465;
                const marginTop = paddingTopMM * 2.83465;
                const marginBottom = paddingBottomMM * 2.83465;

                const contentWidth = width - marginLeft - marginRight;
                const contentHeight = height - marginTop - marginBottom;
                const scaleX = contentWidth / elementWidth;
                const scaleY = contentHeight / elementHeight;

                // Get page dictionary
                const pageDict = firstPage.node;

                // Get or create annotations array
                let annotsArray = pageDict.lookup(PDFName.of('Annots'));
                if (!annotsArray) {
                    annotsArray = PDFArray.withContext(pdfDoc.context);
                    pageDict.set(PDFName.of('Annots'), annotsArray);
                }

                links.forEach((link) => {
                    try {
                        const href = link.getAttribute('href');
                        if (!href) return;

                        // Get link position relative to element using offsetParent
                        let currentElement = link;
                        let offsetX = 0;
                        let offsetY = 0;

                        // Calculate offset from element
                        while (currentElement && currentElement !== element) {
                            offsetX += currentElement.offsetLeft;
                            offsetY += currentElement.offsetTop;
                            currentElement = currentElement.offsetParent;
                        }

                        // Get link dimensions
                        const linkWidth = link.offsetWidth;
                        const linkHeight = link.offsetHeight;

                        // Convert to PDF coordinates
                        // PDF coordinates: (0,0) is bottom-left, Y increases upward
                        // Scale the positions correctly accounting for margins
                        const pdfX = (offsetX * scaleX) + marginLeft;
                        // In PDF, Y=0 is at bottom, so flip Y coordinate
                        // elementHeight is from top, so we need: height - (offsetY + linkHeight)
                        const relativeYFromTop = offsetY;
                        const pdfY = height - ((relativeYFromTop + linkHeight) * scaleY) - marginTop;

                        // Create link annotation dimensions (scaled)
                        const scaledWidth = Math.max(linkWidth * scaleX, 10); // Minimum 10 points for clickability
                        const scaledHeight = Math.max(linkHeight * scaleY, 10); // Minimum 10 points

                        // Ensure coordinates are valid (left < right, bottom < top)
                        const left = pdfX;
                        const right = pdfX + scaledWidth;
                        const bottom = pdfY;
                        const top = pdfY + scaledHeight;

                        // Create annotation dictionary
                        const linkAnnotationDict = PDFDict.withContext(pdfDoc.context);
                        linkAnnotationDict.set(PDFName.of('Type'), PDFName.of('Annot'));
                        linkAnnotationDict.set(PDFName.of('Subtype'), PDFName.of('Link'));
                        linkAnnotationDict.set(PDFName.of('Rect'), pdfDoc.context.obj([left, bottom, right, top]));
                        linkAnnotationDict.set(PDFName.of('Border'), pdfDoc.context.obj([0, 0, 0]));

                        // Create action dictionary
                        const actionDict = PDFDict.withContext(pdfDoc.context);
                        actionDict.set(PDFName.of('Type'), PDFName.of('Action'));
                        actionDict.set(PDFName.of('S'), PDFName.of('URI'));
                        actionDict.set(PDFName.of('URI'), PDFString.of(href));

                        linkAnnotationDict.set(PDFName.of('A'), actionDict);

                        // Register and add annotation to the array
                        const registeredAnnotation = pdfDoc.context.register(linkAnnotationDict);
                        annotsArray.push(registeredAnnotation);
                    } catch (linkError) {
                        console.warn('Failed to add link to PDF:', linkError);
                    }
                });
            }

            // Save the modified PDF with clickable links
            const finalPdfBytes = await pdfDoc.save();
            const modifiedBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });

            // Restore button visibility
            if (downloadButton) {
                downloadButton.style.display = originalDisplay;
            }

            // Download the PDF
            const url = URL.createObjectURL(modifiedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}_${new Date().getTime()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            message.success({
                content: 'PDF downloaded successfully with clickable links!',
                key: 'pdf-download',
                duration: 3
            });
        } catch (error) {
            console.error('PDF Download Error:', error);
            message.error({
                content: error?.message || 'Failed to generate PDF. Please try again.',
                key: 'pdf-download',
                duration: 5
            });
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

