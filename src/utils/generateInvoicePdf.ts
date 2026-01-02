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

    // Import html2canvas and jsPDF
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

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

    // Add clickable links using pdf-lib
    const { PDFDocument, PDFName, PDFString } = await import("pdf-lib");

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
            annots.push(annotationRef);
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
    const pdfBlob = new Blob([finalPdfBytes], { type: "application/pdf" });

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
