import { supabase } from "@/integrations/supabase/client";
import React from "react";
import { createRoot } from "react-dom/client";
import BookingInvoice from "@/components/BookingInvoice";

interface BookingInvoiceData {
  participantName: string;
  activityName: string;
  dateTime: string;
  pickUpLocation: string;
  spotLocation: string;
  spotLocationUrl?: string;
  totalParticipants: number;
  amountPaid: string;
  amountToBePaid: string;
  currency: string;
}

/**
 * Generates a PDF invoice from booking data and uploads it to Supabase storage
 * @param bookingData - The booking data to populate the invoice
 * @param bookingId - The booking ID to use in the filename
 * @returns The public URL of the uploaded PDF
 */
export async function generateInvoicePdf(
  bookingData: BookingInvoiceData,
  bookingId: string
): Promise<string> {
  try {
    // Dynamically import html2pdf
    let html2pdf: any;
    try {
      // @ts-expect-error - html2pdf.js doesn't have type definitions
      const html2pdfModule = await import("html2pdf.js");
      html2pdf =
        html2pdfModule.default ||
        html2pdfModule.html2pdf ||
        html2pdfModule ||
        (window as any).html2pdf;

      if (!html2pdf && (window as any).html2pdf) {
        html2pdf = (window as any).html2pdf;
      }

      if (!html2pdf) {
        throw new Error("html2pdf.js module not found");
      }
    } catch (importError) {
      console.error("Failed to import html2pdf:", importError);
      throw new Error("Failed to load PDF library");
    }

    // Create a temporary container to render the invoice
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "600px";
    container.style.background = "#f5f7fb";
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

    // Get the invoice element - find the div with width 600px (the inner container)
    // The structure is: container > div (outer) > div (inner with 600px width)
    let element = container.querySelector('div[style*="600px"]') as HTMLElement;
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

    // Get exact dimensions from the element
    const elementWidth = element.offsetWidth || 600;
    const elementHeight = element.scrollHeight || element.offsetHeight;

    // Convert pixels to mm (1px = 0.264583mm at 96 DPI)
    const widthInMM = elementWidth * 0.264583;
    const paddingTopMM = 32 * 0.264583;
    const paddingBottomMM = 24 * 0.264583;
    const paddingSideMM = 32 * 0.264583;

    // PDF generation options
    const opt = {
      margin: [paddingTopMM, paddingSideMM, paddingBottomMM, paddingSideMM],
      filename: `Booking_Invoice_${bookingId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        letterRendering: true,
        backgroundColor: "#ffffff",
        windowWidth: elementWidth,
        windowHeight: elementHeight,
        width: elementWidth,
        height: elementHeight,
      },
      jsPDF: {
        unit: "mm",
        format: [widthInMM, elementHeight * 0.264583],
        orientation: "portrait",
        compress: true,
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
        avoid: ["header", "h1"],
      },
    };

    // Generate PDF as blob
    let worker;
    if (typeof html2pdf === "function") {
      worker = html2pdf();
    } else if (html2pdf && typeof html2pdf.default === "function") {
      worker = html2pdf.default();
    } else {
      root.unmount();
      document.body.removeChild(container);
      throw new Error("html2pdf is not a valid function");
    }

    const pdfBlob = await worker.set(opt).from(element).output("blob");

    if (!pdfBlob) {
      root.unmount();
      document.body.removeChild(container);
      throw new Error("Failed to generate PDF blob");
    }

    // Clean up the temporary container
    root.unmount();
    document.body.removeChild(container);

    // Upload to Supabase storage
    const fileName = `${bookingId}/${Date.now()}.pdf`;

    const { data, error } = await supabase.storage
      .from("booking-invoices")
      .upload(fileName, pdfBlob);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("booking-invoices").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}
