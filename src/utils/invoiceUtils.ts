import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Generate booking number in format YYMMDD + order count (e.g., 26011801, 26011802)
 */
export async function generateBookingNumber(): Promise<string> {
  const today = new Date();
  const todayPrefix = format(today, "yyMMdd"); // YYMMDD format

  // Count bookings created today with booking_number starting with today's prefix
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("booking_number")
    .like("booking_number", `${todayPrefix}%`)
    .order("booking_number", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching bookings for booking number:", error);
    // Fallback: use timestamp-based number
    return `${todayPrefix}${String(Date.now()).slice(-2)}`;
  }

  let orderCount = 1;
  if (bookings && bookings.length > 0) {
    const lastBooking = bookings[0] as any;
    if (lastBooking?.booking_number) {
      const lastNumber = lastBooking.booking_number;
      const lastCount = parseInt(lastNumber.substring(6), 10);
      if (!isNaN(lastCount)) {
        orderCount = lastCount + 1;
      }
    }
  }

  // Generate booking number: YYMMDD + count (padded to 2 digits)
  const bookingNumber = `${todayPrefix}${String(orderCount).padStart(2, "0")}`;
  return bookingNumber;
}

/**
 * Generate invoice number for tax invoice
 */
export function generateInvoiceNumber(bookingNumber: string): string {
  const today = format(new Date(), "yyyyMMdd");
  return `INV-${bookingNumber}-${today}`;
}

/**
 * Calculate tax invoice data from booking
 */
export function calculateTaxInvoiceData(
  booking: any,
  experience: any,
  activity: any
) {
  const bookingAmountVal = parseFloat(String(booking.booking_amount || 0));
  const totalParticipants = booking.total_participants || 1;
  // Original amount should be from activity.price first
  const originalPricePerPerson = activity?.price ?? experience?.price ?? 0;

  // Ticket price per person (actual amount paid per person)
  const ticketPricePerPerson = bookingAmountVal / totalParticipants;

  // Discount per person = original price per person - ticket price per person
  const discountPerPerson = originalPricePerPerson - ticketPricePerPerson;

  // Total discount = discount_per_person * total participants (as stored in invoice table)
  const totalDiscount = discountPerPerson * totalParticipants;

  // Discount on base price per person = discount per person / 1.18
  const discountOnBasePerPerson = discountPerPerson / 1.18;

  // Net amount per person from ORIGINAL price (before discount) = original price / 1.18
  const originalBasePricePerPerson = originalPricePerPerson / 1.18;
  // Tax amount per person on original price (18% of original base)
  const originalTaxPerPerson = originalBasePricePerPerson * 0.18;

  // For invoice display: use original base price (not discounted)
  const netPricePerPerson = originalBasePricePerPerson;
  const basePricePerPerson = originalBasePricePerPerson;
  const taxAmountPerPerson = originalTaxPerPerson;

  // Final amount per person after discount
  const finalNetPricePerPerson =
    originalBasePricePerPerson - discountOnBasePerPerson;
  const finalTaxPerPerson = originalTaxPerPerson; // Tax stays on original amount
  const totalPricePerPerson = finalNetPricePerPerson + finalTaxPerPerson;

  // Calculate totals
  const totalNetPrice = originalBasePricePerPerson * totalParticipants; // Net from original price
  const totalTaxAmount = originalTaxPerPerson * totalParticipants; // Tax on original price
  // totalDiscount is already calculated above as discountPerPerson * totalParticipants
  const totalDiscountOnBase = discountOnBasePerPerson * totalParticipants; // Discount on base
  const totalBasePrice = originalBasePricePerPerson * totalParticipants; // Net amount shown in invoice (from original)
  const totalAmount = totalPricePerPerson * totalParticipants;

  return {
    originalPricePerPerson,
    basePricePerPerson,
    taxAmountPerPerson,
    totalPricePerPerson,
    discountPerPerson,
    netPricePerPerson,
    totalBasePrice,
    totalTaxAmount,
    totalAmount,
    totalDiscount,
    totalNetPrice,
    totalDiscountOnBase, // Discount on base amount
  };
}

/**
 * Create invoice record in database
 */
export async function createInvoiceRecord(
  bookingId: string,
  bookingNumber: string,
  booking: any,
  experience: any,
  activity: any,
  vendorProfile?: any
) {
  // Calculate tax invoice data
  const taxData = calculateTaxInvoiceData(booking, experience, activity);

  // Generate invoice number
  const invoiceNumber = generateInvoiceNumber(bookingNumber);
  const invoiceDate = format(
    new Date(booking.booking_date || new Date()),
    "dd MMM yyyy"
  );

  // Get vendor details
  const logoUrl = vendorProfile?.logo_url || "";
  const vendorName =
    `${vendorProfile?.first_name || ""} ${
      vendorProfile?.last_name || ""
    }`.trim() ||
    vendorProfile?.company_name ||
    "";
  const vendorAddress = vendorProfile?.address || "";
  const vendorGST = vendorProfile?.gst_number || "";
  const placeOfSupply = vendorProfile?.state || "Gujarat";

  // Customer address
  const customerAddress = booking.pickup_location || experience?.location || "";

  // Date time string
  const dateTime = booking.time_slots
    ? `${format(new Date(booking.booking_date), "dd/MM/yyyy")} - ${
        booking.time_slots.start_time
      } - ${booking.time_slots.end_time}`
    : format(new Date(booking.booking_date), "dd/MM/yyyy");

  // Create tax invoice record
  const taxInvoiceData = {
    booking_id: bookingId,
    booking_number: bookingNumber,
    invoice_number: invoiceNumber,
    invoice_date: new Date(booking.booking_date || new Date()).toISOString(),
    customer_name: booking.contact_person_name || "Customer",
    customer_address: customerAddress,
    customer_email: booking.contact_person_email || null,
    customer_phone: booking.contact_person_number || null,
    experience_title: experience?.title || "Experience",
    activity_name: activity?.name || "",
    date_time: dateTime,
    total_participants: booking.total_participants || 1,
    original_price_per_person: taxData.originalPricePerPerson,
    base_price_per_person: taxData.basePricePerPerson,
    tax_amount_per_person: taxData.taxAmountPerPerson,
    total_price_per_person: taxData.totalPricePerPerson,
    discount_per_person: taxData.discountPerPerson,
    net_price_per_person: taxData.netPricePerPerson,
    total_base_price: taxData.totalBasePrice,
    total_tax_amount: taxData.totalTaxAmount,
    total_amount: taxData.totalAmount,
    total_discount: taxData.totalDiscount,
    total_net_price: taxData.totalNetPrice,
    currency: experience?.currency || "INR",
    vendor_name: vendorName || null,
    vendor_address: vendorAddress || null,
    vendor_gst: vendorGST || null,
    place_of_supply: placeOfSupply,
    hsn_code: "999799",
    logo_url: logoUrl || null,
    invoice_type: "tax",
  };

  const { data: invoice, error } = await supabase
    .from("invoices" as any)
    .insert(taxInvoiceData as any)
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice record:", error);
    throw error;
  }

  return invoice;
}
