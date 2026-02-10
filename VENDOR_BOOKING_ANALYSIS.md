# Vendor Booking Flow & My Bookings Page Analysis

## Overview
This document provides a comprehensive analysis of the current vendor booking flow and the "My Bookings" page for vendors in the BucketListt application.

---

## 1. Vendor Booking Flow

### 1.1 Booking Creation Process

**Location**: `src/components/BookingDialog.tsx`

**Flow**:
1. **User initiates booking** from experience detail page
2. **BookingDialog component** opens with multi-step form:
   - Step 1: Activity Selection (if multiple activities exist)
   - Step 2: Date/Time Slot Selection
   - Step 3: Participant Information (mobile only)
3. **Form validation** using Zod schema:
   - Participant details (name, email, phone)
   - Participant count (1-50)
   - Terms acceptance
   - Date and time slot selection
4. **Payment processing**:
   - Supports Razorpay integration
   - Handles partial payments (10% advance)
   - Supports B2B pricing
   - Coupon code validation
5. **Booking creation**:
   - Creates booking record in `bookings` table
   - Creates participant records in `booking_participants` table
   - Default status: `'confirmed'`
   - Sends confirmation email
   - Sends WhatsApp notification (if configured)

**Key Fields Stored**:
- `user_id`: Customer who made the booking
- `experience_id`: The experience being booked
- `time_slot_id`: Selected time slot
- `booking_date`: Date of the experience
- `total_participants`: Number of participants
- `booking_amount`: Total amount paid
- `due_amount`: Remaining amount to be paid
- `b2bPrice`: B2B price if applicable
- `status`: Default 'confirmed'
- `contact_person_name`, `contact_person_number`, `contact_person_email`
- `isAgentBooking`: Boolean flag for agent bookings
- `referral_code`: Referral information

### 1.2 Vendor Perspective on Bookings

**Vendors do NOT create bookings directly**. Instead:
- Customers create bookings for vendor experiences
- Vendors can **view** all bookings for their experiences
- Vendors can **export** booking data to Excel
- Vendors can **view** bookings in calendar format

**Access Control**:
- Vendors see bookings where `experiences.vendor_id = vendor.user_id`
- Implemented via Supabase RLS (Row Level Security) policies
- Query filter: `query.eq("experiences.vendor_id", user.id)`

---

## 2. Vendor "My Bookings" Page

### 2.1 Page Structure

**Location**: `src/pages/Bookings.tsx`

**Components**:
- Header component
- Page title: "My Bookings"
- Export to Excel button (vendor-only)
- `UserBookings` component (shared between users and vendors)

### 2.2 UserBookings Component

**Location**: `src/components/UserBookings.tsx`

**Key Features**:

#### 2.2.1 Data Fetching
```typescript
// Query logic in UserBookings.tsx (lines 361-445)
- Fetches bookings with related data:
  * experiences (title, location, price, currency, vendor_id)
  * time_slots (with activities nested)
  * booking_participants (name, email, phone_number)

// Vendor-specific filtering (line 411-412)
if (user.user_metadata.role === "vendor") {
  query = query.eq("experiences.vendor_id", user.id);
}
```

#### 2.2.2 Excel Export Functionality
**Location**: `src/pages/Bookings.tsx` (lines 24-228)

**Features**:
- Vendor-only feature
- Exports all vendor bookings to Excel
- Includes summary statistics:
  - Total bookings count
  - Total revenue
  - Export timestamp
- Columns exported:
  - Booking ID
  - Experience Title
  - Customer Name, Email, Phone
  - Booking Date, Time Slot
  - Activity, Participants
  - Price, Currency, Status
  - Location, Notes

#### 2.2.3 Table Features

**20+ Columns Available** (lines 132-154):
1. Title
2. Activity
3. Contact Number
4. Contact Name
5. Email
6. Referred by
7. Timeslot
8. Date
9. No. Of Participants
10. Notes for guides
11. Official Price/ Original Price
12. B2B Price
13. Commission as per vendor
14. Website Price
15. Discount Coupon
16. Ticket Price (customer cost)
17. Advance paid to bucketlistt (10%)
18. Payment to be collected by vendor
19. Actual Commission to bucketlistt (Net profit)
20. Amount to be collected from vendor/ '- to be paid'
21. Advance + discount (vendor needs this)

**Default Visible Columns for Vendors** (lines 78-88):
- Activity (column 1)
- Contact Number (column 2)
- Contact Name (column 3)
- Timeslot (column 6)
- No. Of Participants (column 8)
- Payment to be collected by vendor (column 17)
- Amount to be collected from vendor (column 19)

**Advanced Features**:
1. **Column Management**:
   - Show/hide columns
   - Resize columns (drag handles)
   - Reorder columns (drag & drop)
   - Column selector dropdown

2. **Filtering**:
   - Global search filter
   - Excel-like column filters
   - Date range filter (mobile)
   - Today only filter
   - Activity filter
   - Timeslot filter
   - Experience filter (admin only)
   - Agent filter (admin only)
   - Vendor filter (admin only)

3. **Sorting**:
   - Sort by any column
   - Ascending/Descending toggle
   - Visual sort indicators (↑ ↓ ⇅)
   - Default sort: Date (descending)

4. **Financial Calculations**:
   - Official Price = Activity Price × Participants
   - B2B Price = B2B Price × Participants
   - Commission = (Official Price - B2B Price) × Participants
   - Website Price = Discounted Price × Participants
   - Discount Coupon = Official Price - Booking Amount
   - Advance Paid = Booking Amount - Due Amount
   - Payment to Collect = Booking Amount - Advance Paid
   - Actual Commission = Booking Amount - (B2B Price × Participants)
   - Amount to Collect from Vendor = Booking Amount - (B2B Price × Participants) - Advance Paid
   - Advance + Discount = Advance Paid + Discount Coupon

#### 2.2.4 Status Management

**Current Status Values**:
- `confirmed` (default)
- `pending`
- `cancelled`

**Status Display** (lines 1014-1025):
- Color-coded badges:
  - Confirmed: Green (`bg-green-100 text-green-700`)
  - Pending: Yellow (`bg-yellow-100 text-yellow-700`)
  - Cancelled: Red (`bg-red-100 text-red-700`)

**Note**: Currently, there's **NO UI for vendors to update booking status**. Status is set during booking creation and can only be changed via direct database updates or admin actions.

#### 2.2.5 Mobile Responsiveness
- Responsive table layout
- Mobile-specific date range picker
- Touch-friendly interactions
- Optimized column visibility for small screens

---

## 3. Vendor Calendar View

**Location**: `src/components/VendorCalendar.tsx` & `src/pages/VendorCalendarPage.tsx`

**Route**: `/profile/calendar`

**Features**:
1. **Weekly Calendar View**:
   - Shows bookings for current week
   - Color-coded capacity indicators:
     - Green: < 50% filled
     - Yellow: 50-69% filled
     - Orange: 70-89% filled
     - Red: ≥ 90% filled

2. **Activity Filter**:
   - Filter by specific activity
   - Shows time slots for selected activity

3. **Booking Details Modal**:
   - Click on a time slot to see detailed bookings
   - Shows:
     - Contact person name
     - Contact number
     - Number of participants
     - Booking date and time

4. **Navigation**:
   - Previous/Next week buttons
   - "Today" button to jump to current week

**Data Fetching**:
- Fetches vendor's experiences
- Fetches activities for those experiences
- Fetches time slots for selected activity
- Fetches bookings for the week (excludes cancelled)

---

## 4. Database Schema

### 4.1 Bookings Table
```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  experience_id UUID REFERENCES public.experiences(id) NOT NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  time_slot_id UUID REFERENCES public.time_slots(id),
  note_for_guide TEXT,
  total_participants INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'confirmed',
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  referral_code TEXT,
  contact_person_name TEXT,
  contact_person_number TEXT,
  contact_person_email TEXT,
  booking_amount NUMERIC,
  due_amount NUMERIC,
  b2bPrice NUMERIC,
  isAgentBooking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 4.2 Booking Participants Table
```sql
CREATE TABLE public.booking_participants (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 4.3 RLS Policies
- Users can view their own bookings
- Vendors can view bookings for their experiences (via RLS on experiences join)
- Admins can view all bookings

---

## 5. Key Findings & Observations

### 5.1 Strengths
1. ✅ **Comprehensive data display**: 20+ columns with financial breakdowns
2. ✅ **Flexible filtering**: Multiple filter options for finding specific bookings
3. ✅ **Export functionality**: Excel export with summary statistics
4. ✅ **Calendar view**: Visual representation of bookings
5. ✅ **Mobile responsive**: Works well on mobile devices
6. ✅ **Financial transparency**: Clear breakdown of pricing, commissions, and payments

### 5.2 Limitations & Missing Features

1. ❌ **No status update UI**: Vendors cannot update booking status (confirm/cancel) from the UI
2. ❌ **No bulk actions**: Cannot select multiple bookings for batch operations
3. ❌ **No booking details view**: Cannot click on a booking to see full details
4. ❌ **No customer communication**: No direct way to contact customers from bookings page
5. ❌ **No booking notes**: Vendors cannot add internal notes to bookings
6. ❌ **No payment tracking**: No clear indication of payment status per booking
7. ❌ **No export filters**: Excel export includes all bookings, no date/status filters
8. ❌ **No print view**: No print-friendly format for bookings
9. ❌ **Limited status values**: Only confirmed, pending, cancelled (no "completed", "no-show", etc.)
10. ❌ **No booking history**: No audit trail of status changes

### 5.3 Potential Improvements

1. **Status Management**:
   - Add status update buttons (Confirm, Cancel, Mark as Completed)
   - Add status change history/audit log
   - Add reason field for cancellations

2. **Booking Details**:
   - Clickable booking rows to view full details
   - Modal or separate page for booking details
   - Show all participants, payment history, notes

3. **Communication**:
   - Quick actions: Call, Email, WhatsApp
   - Send booking reminders
   - Send confirmation messages

4. **Filtering & Export**:
   - Add status filter to export
   - Add date range filter to export
   - Add experience filter to export

5. **Financial Dashboard**:
   - Summary cards (total revenue, pending payments, etc.)
   - Charts/graphs for revenue trends
   - Payment status indicators

6. **Bulk Operations**:
   - Select multiple bookings
   - Bulk status updates
   - Bulk export selected bookings

7. **Search Enhancement**:
   - Search by customer name, phone, email
   - Search by booking ID
   - Advanced search with multiple criteria

---

## 6. Code Structure

### 6.1 Key Files
- `src/pages/Bookings.tsx` - Main bookings page
- `src/components/UserBookings.tsx` - Main bookings table component (2456 lines)
- `src/components/BookingDialog.tsx` - Booking creation dialog
- `src/components/VendorCalendar.tsx` - Calendar view component
- `src/pages/VendorCalendarPage.tsx` - Calendar page wrapper

### 6.2 Dependencies
- React Query for data fetching
- Supabase for database operations
- React Hook Form + Zod for form validation
- date-fns for date manipulation
- XLSX for Excel export
- Lucide React for icons

### 6.3 State Management
- React Query for server state
- React useState for local UI state
- useAuth hook for authentication
- useUserRole hook for role checking

---

## 7. User Flow Diagram

```
Customer Flow:
1. Browse Experience → 2. Select Date/Time → 3. Fill Form → 4. Payment → 5. Booking Created

Vendor Flow:
1. Login → 2. Navigate to "My Bookings" → 3. View Bookings Table → 4. Filter/Sort → 5. Export (optional)
   OR
1. Login → 2. Navigate to Calendar → 3. View Weekly Calendar → 4. Click Time Slot → 5. View Booking Details
```

---

## 8. Recommendations

### High Priority
1. **Add status update functionality** for vendors
2. **Add booking details view** (clickable rows)
3. **Add payment status indicators** in the table
4. **Improve export filters** (date range, status)

### Medium Priority
1. **Add customer communication tools** (call, email, WhatsApp)
2. **Add booking notes** for vendors
3. **Add bulk operations** for status updates
4. **Add financial summary dashboard**

### Low Priority
1. **Add booking history/audit log**
2. **Add print view**
3. **Add more status values** (completed, no-show, etc.)
4. **Add booking reminders** functionality

---

## Conclusion

The vendor booking flow and "My Bookings" page provide a solid foundation with comprehensive data display and filtering capabilities. However, there are opportunities to enhance vendor experience by adding status management, booking details view, and communication tools. The current implementation focuses heavily on data visualization and export, which is valuable, but lacks interactive features for managing bookings.

