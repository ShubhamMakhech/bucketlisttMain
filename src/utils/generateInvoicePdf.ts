import { supabase } from "@/integrations/supabase/client";
import React from "react";
import { createRoot } from "react-dom/client";
import BookingInvoice from "@/components/BookingInvoice";

interface BookingInvoiceData {
  participantName: string;
  experienceTitle: string;
  activityName: string;
  dateTime: string;
  pickUpLocation: string;
  spotLocation: string;
  spotLocationUrl?: string;
  totalParticipants: number;
  amountPaid: string;
  amountToBePaid: string;
  advancePlusDiscount?: string;
  currency: string;
  logoUrl?: string;
}

/**
 * Helper function to log debug information to Supabase logs table (non-blocking)
 */
async function logDebug(
  type: string,
  bookingId: string,
  message: string,
  metadata: any = {}
) {
  // Fire-and-forget logging - don't block the main flow
  setTimeout(() => {
    const userAgent = navigator.userAgent || "unknown";
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent) || false;
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || false;
    const isAndroid = /Android/i.test(userAgent) || false;

    // @ts-ignore - logs table exists but may not be in TypeScript schema
    const logsQuery = supabase.from("logs").insert({
      type,
      booking_id: bookingId,
      error_message: message,
      metadata: {
        ...metadata,
        device_info: {
          user_agent: userAgent,
          is_mobile: isMobile,
          is_ios: isIOS,
          is_android: isAndroid,
          platform: navigator?.platform || "unknown",
          language: navigator?.language || "unknown",
          screen_width: window?.screen?.width || "unknown",
          screen_height: window?.screen?.height || "unknown",
          window_width: window?.innerWidth || "unknown",
          window_height: window?.innerHeight || "unknown",
          connection_type:
            (navigator as any)?.connection?.effectiveType || "unknown",
        },
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });

    // Handle the promise - cast to any to avoid TypeScript issues
    (logsQuery as any)
      ?.then(() => {
        // Successfully logged
      })
      ?.catch((error: any) => {
        // Silently fail - table might not exist
        console.error("Failed to log debug info:", error);
      });
  }, 0);
}

/**
 * Helper function to dynamically import a module with retry logic for mobile browsers
 */
async function importWithRetry<T>(
  importFn: () => Promise<T>,
  moduleName: string,
  maxRetries = 3,
  retryDelay = 500,
  bookingId?: string
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await importFn();
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Enhanced error message with device/browser info
  const userAgent = navigator?.userAgent || "unknown";
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent) || false;
  const errorMessage = `Failed to load ${moduleName} after ${maxRetries} attempts${
    isMobile ? " (mobile browser)" : ""
  }`;

  // Log final failure
  if (bookingId) {
    await logDebug(
      "pdf_import_failed",
      bookingId,
      `Failed to import ${moduleName} after all retries`,
      {
        module: moduleName,
        attempts: maxRetries,
        error:
          lastError instanceof Error ? lastError.message : String(lastError),
        error_stack: lastError instanceof Error ? lastError.stack : undefined,
      }
    );
  }

  console.error(errorMessage, {
    module: moduleName,
    attempts: maxRetries,
    userAgent,
    isMobile,
    originalError: lastError,
  });

  throw new Error(errorMessage);
}

/**
 * Generates a PDF invoice from booking data and downloads it directly
 * @param bookingData - The booking data to populate the invoice
 * @param bookingId - The booking ID to use in the filename
 * @param fileName - Optional custom filename (defaults to booking invoice)
 */
export async function generateInvoicePdf(
  bookingData: BookingInvoiceData,
  bookingId: string,
  fileName?: string
): Promise<void> {
  const startTime = Date.now();

  try {
    // Create a temporary container to render the invoice
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "700px"; // MATCHES BookingInvoice.jsx width
    container.style.background = "#ffffff";
    document.body.appendChild(container);

    // Create a root and render the invoice component
    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(BookingInvoice, {
          ...bookingData,
          showDownloadButton: false,
        })
      );
      // Wait for component to render
      setTimeout(resolve, 1000);
    });

    // Get the invoice element - find the div with width 700px (the inner container)
    // The structure is: container > div (outer) > div (inner with 700px width)
    let element = container.querySelector('div[style*="700px"]') as HTMLElement;
    if (!element) {
      // Fallback: get the inner div (second level)
      const outerDiv = container.querySelector("div > div") as HTMLElement;
      if (outerDiv) {
        element = outerDiv;
      } else {
        // Last fallback: get any div with background white
        element = container.querySelector(
          'div[style*="background"]'
        ) as HTMLElement;
      }
      if (!element) {
        await logDebug(
          "pdf_element_not_found",
          bookingId,
          "Invoice element not found after render",
          { container_html: container.innerHTML.substring(0, 500) }
        );
        root.unmount();
        document.body.removeChild(container);
        throw new Error("Invoice element not found");
      }
    }

    // Wait a bit to ensure content is rendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Wait for images to load
    await new Promise<void>((resolve) => {
      const images = element.querySelectorAll("img");
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

    // Import html2canvas and jsPDF with retry logic for mobile browsers
    const html2canvas = (
      await importWithRetry(
        () => import("html2canvas"),
        "html2canvas",
        3,
        500,
        bookingId
      )
    ).default;

    const { jsPDF } = await importWithRetry(
      () => import("jspdf"),
      "jspdf",
      3,
      500,
      bookingId
    );

    // Capture element as image using html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High quality
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      width: 700,
      height: element.scrollHeight,
      windowWidth: 700,
      windowHeight: element.scrollHeight,
    });

    // Create PDF and add image
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    // Calculate dimensions to fit on A4
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const marginX = 10; // 10mm side margins
    const marginY = 10; // 10mm top/bottom margins

    const maxWidth = pageWidth - 2 * marginX; // 190mm
    const maxHeight = pageHeight - 2 * marginY; // 277mm

    // Calculate image dimensions in mm
    const imgWidthMM = maxWidth; // Use full available width
    const imgHeightMM = (canvas.height / canvas.width) * imgWidthMM;

    // Check if height fits on one page
    if (imgHeightMM <= maxHeight) {
      // Fits on one page - add with margins
      doc.addImage(imgData, "JPEG", marginX, marginY, imgWidthMM, imgHeightMM);
    } else {
      // Slightly too tall - scale down to fit
      const scaleFactor = maxHeight / imgHeightMM;
      const finalWidth = imgWidthMM * scaleFactor;
      const finalHeight = maxHeight;
      const centerX = (pageWidth - finalWidth) / 2;
      doc.addImage(imgData, "JPEG", centerX, marginY, finalWidth, finalHeight);
    }

    // Add clickable links using pdf-lib with retry logic
    const { PDFDocument, PDFName, PDFString } = await importWithRetry(
      () => import("pdf-lib"),
      "pdf-lib",
      3,
      500,
      bookingId
    );

    // Convert to PDFDocument for link manipulation
    const pdfBytes = doc.output("arraybuffer");
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();

    // Find all links in the element
    const links = element.querySelectorAll("a[href]");

    if (links.length > 0) {
      // Calculate the actual image position and size on the PDF
      let actualImgX: number,
        actualImgY: number,
        actualImgWidth: number,
        actualImgHeight: number;

      if (imgHeightMM <= maxHeight) {
        actualImgX = marginX;
        actualImgY = marginY;
        actualImgWidth = imgWidthMM;
        actualImgHeight = imgHeightMM;
      } else {
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
      const scaleX = imgWidthPt / 700;
      const scaleY = imgHeightPt / element.scrollHeight;

      links.forEach((link) => {
        try {
          const href = link.getAttribute("href");
          if (!href) return;

          // Get link position relative to element
          const rect = link.getBoundingClientRect();
          const elemRect = element.getBoundingClientRect();

          const relX = rect.left - elemRect.left;
          const relY = rect.top - elemRect.top;
          const linkWidth = rect.width;
          const linkHeight = rect.height;

          // Convert to PDF coordinates (PDF Y is from bottom)
          const pdfX = imgXPt + relX * scaleX;
          const pdfYFromBottom =
            pdfHeight - (imgYPt + (relY + linkHeight) * scaleY);

          const scaledWidth = linkWidth * scaleX;
          const scaledHeight = linkHeight * scaleY;

          // Create link annotation manually with iOS compatibility
          const annotation = pdfDoc.context.obj({
            Type: "Annot",
            Subtype: "Link",
            Rect: [
              pdfX,
              pdfYFromBottom,
              pdfX + scaledWidth,
              pdfYFromBottom + scaledHeight,
            ],
            Border: [0, 0, 0],
            F: 4, // Flags: 4 = Print (required for iOS)
            H: PDFName.of("I"), // Highlight mode: Invert
            A: {
              Type: "Action",
              S: "URI",
              URI: PDFString.of(href), // Use PDFString for iOS compatibility
            },
          });

          const annotationRef = pdfDoc.context.register(annotation);
          const annots = firstPage.node.lookup(PDFName.of("Annots"));
          if (annots) {
            const annotsArray = annots as any;
            if (Array.isArray(annotsArray)) {
              annotsArray.push(annotationRef);
            } else {
              firstPage.node.set(
                PDFName.of("Annots"),
                pdfDoc.context.obj([annotsArray, annotationRef])
              );
            }
          } else {
            firstPage.node.set(
              PDFName.of("Annots"),
              pdfDoc.context.obj([annotationRef])
            );
          }
        } catch (linkError) {
          console.warn("Failed to add link annotation:", linkError);
        }
      });
    }

    // Save the modified PDF with clickable links
    const finalPdfBytes = await pdfDoc.save();
    const pdfBlob = new Blob([new Uint8Array(finalPdfBytes)], {
      type: "application/pdf",
    });

    if (!pdfBlob) {
      root.unmount();
      document.body.removeChild(container);
      throw new Error("Failed to generate PDF blob");
    }

    // Clean up the temporary container
    root.unmount();
    document.body.removeChild(container);

    // Download PDF directly
    const downloadFileName = fileName || `Booking_Invoice_${bookingId}.pdf`;
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    const errorTime = Date.now();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("PDF generation error:", error);

    // Log comprehensive error details
    await logDebug(
      "pdf_generation_error",
      bookingId,
      `PDF generation failed: ${errorMessage}`,
      {
        error: errorMessage,
        error_stack: errorStack,
        total_time_ms: errorTime - startTime,
        booking_data: {
          participant_name: bookingData.participantName,
          experience_title: bookingData.experienceTitle,
          activity_name: bookingData.activityName,
        },
      }
    );

    throw error;
  }
}
