import { supabase } from "@/integrations/supabase/client";
import React from "react";
import { createRoot } from "react-dom/client";
import TaxInvoice from "@/components/TaxInvoice";

interface TaxInvoiceData {
  customerName: string;
  customerAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  experienceTitle: string;
  activityName: string;
  dateTime: string;
  totalParticipants: number;
  originalPricePerPerson: number;
  basePricePerPerson: number;
  taxAmountPerPerson: number;
  totalPricePerPerson: number;
  discountPerPerson: number;
  netPricePerPerson: number;
  totalBasePrice: number;
  totalTaxAmount: number;
  totalAmount: number;
  totalDiscount: number;
  totalNetPrice: number;
  currency: string;
  logoUrl?: string;
  vendorName?: string;
  vendorAddress?: string;
  vendorGST?: string;
  placeOfSupply?: string;
  hsnCode?: string;
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
      "tax_invoice_pdf_import_failed",
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
 * Generates a PDF tax invoice from booking data and uploads it to Supabase storage
 * @param invoiceData - The tax invoice data to populate the invoice
 * @param bookingId - The booking ID to use in the filename
 * @returns The public URL of the uploaded PDF
 */
export async function generateTaxInvoicePdf(
  invoiceData: TaxInvoiceData,
  bookingId: string
): Promise<string> {
  const startTime = Date.now();

  try {
    // Create a temporary container to render the invoice
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "700px"; // MATCHES TaxInvoice.jsx width
    container.style.background = "#ffffff";
    document.body.appendChild(container);

    // Create a root and render the invoice component
    const root = createRoot(container);
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(TaxInvoice, {
          ...invoiceData,
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
          "tax_invoice_pdf_element_not_found",
          bookingId,
          "Tax invoice element not found after render",
          { container_html: container.innerHTML.substring(0, 500) }
        );
        root.unmount();
        document.body.removeChild(container);
        throw new Error("Tax invoice element not found");
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

    // Save the PDF
    const pdfBlob = new Blob([doc.output("blob")], {
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

    // Upload to Supabase storage
    const fileName = `${bookingId}/tax-invoice-${Date.now()}.pdf`;

    const { data, error } = await supabase.storage
      .from("booking-invoices")
      .upload(fileName, pdfBlob);

    if (error) {
      await logDebug(
        "tax_invoice_pdf_upload_failed",
        bookingId,
        "Tax invoice PDF upload to storage failed",
        {
          error: error.message,
          error_details: error,
          file_name: fileName,
          blob_size: pdfBlob.size,
          total_time_ms: Date.now() - startTime,
        }
      );
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("booking-invoices").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    const errorTime = Date.now();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Tax invoice PDF generation error:", error);

    // Log comprehensive error details
    await logDebug(
      "tax_invoice_pdf_generation_error",
      bookingId,
      `Tax invoice PDF generation failed: ${errorMessage}`,
      {
        error: errorMessage,
        error_stack: errorStack,
        total_time_ms: errorTime - startTime,
        invoice_data: {
          customer_name: invoiceData.customerName,
          experience_title: invoiceData.experienceTitle,
          invoice_number: invoiceData.invoiceNumber,
        },
      }
    );

    throw error;
  }
}
