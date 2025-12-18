# Discount Coupon System Setup

This document explains how to set up the discount coupon system for your booking platform.

## Database Migration

### 1. Run the Migration

You need to run the migration file to create the `discount_coupons` table:

```bash
# If you have Supabase CLI installed
supabase db push

# Or manually run the SQL in your Supabase dashboard
```

The migration file is located at: `supabase/migrations/20250115000000-create-discount-coupons.sql`

### 2. What the Migration Creates

- **`discount_coupons` table** with the following columns:

  - `id` (UUID, Primary Key)
  - `coupon_code` (TEXT, Unique per experience)
  - `is_active` (BOOLEAN, Default: true)
  - `experience_id` (UUID, Foreign Key to experiences)
  - `type` (TEXT, 'flat' or 'percentage')
  - `discount_value` (DECIMAL, Discount amount/percentage)
  - `max_uses` (INTEGER, Optional usage limit)
  - `used_count` (INTEGER, Current usage count)
  - `valid_from` (TIMESTAMP, When coupon becomes valid)
  - `valid_until` (TIMESTAMP, Optional expiry date)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- **Indexes** for better performance
- **Row Level Security (RLS)** policies
- **Constraints** for data validation
- **Triggers** for automatic timestamp updates

## Supabase Edge Functions

### 1. Deploy the Functions

You need to deploy these three Edge Functions:

#### Create Discount Coupon Function

- **File**: `supabase/functions/create-discount-coupon/index.ts`
- **Purpose**: Creates new discount coupons for experiences
- **Endpoint**: `https://your-project.supabase.co/functions/v1/create-discount-coupon`

#### Validate Discount Coupon Function

- **File**: `supabase/functions/validate-discount-coupon/index.ts`
- **Purpose**: Validates coupon codes and calculates discounts
- **Endpoint**: `https://your-project.supabase.co/functions/v1/validate-discount-coupon`

#### Apply Discount Coupon Function

- **File**: `supabase/functions/apply-discount-coupon/index.ts`
- **Purpose**: Applies coupon and increments usage count
- **Endpoint**: `https://your-project.supabase.co/functions/v1/apply-discount-coupon`

### 2. Deploy Commands

```bash
# Deploy all functions
supabase functions deploy create-discount-coupon
supabase functions deploy validate-discount-coupon
supabase functions deploy apply-discount-coupon

# Or deploy all at once
supabase functions deploy
```

## Frontend Components

### 1. React Hook

- **File**: `src/hooks/useDiscountCoupon.tsx`
- **Purpose**: Provides functions to interact with coupon system

### 2. Coupon Input Component

- **File**: `src/components/CouponInput.tsx`
- **Purpose**: UI for customers to enter and validate coupon codes

### 3. Coupon Manager Component

- **File**: `src/components/CouponManager.tsx`
- **Purpose**: UI for vendors to create and manage coupons

## Usage Examples

### For Customers (Booking Flow)

```tsx
import { CouponInput } from "@/components/CouponInput";

<CouponInput
  experienceId="experience-uuid"
  bookingAmount={100}
  currency="USD"
  onCouponApplied={(result) => {
    // Handle successful coupon application
    console.log("Discount:", result.discount_calculation?.discount_amount);
  }}
  onCouponRemoved={() => {
    // Handle coupon removal
  }}
/>;
```

### For Vendors (Experience Management)

```tsx
import { CouponManager } from "@/components/CouponManager";

<CouponManager
  experienceId="experience-uuid"
  experienceTitle="Experience Name"
/>;
```

### Using the Hook Directly

```tsx
import { useDiscountCoupon } from "@/hooks/useDiscountCoupon";

const { validateCoupon, createCoupon, applyCoupon } = useDiscountCoupon();

// Validate a coupon
const result = await validateCoupon("SAVE20", "experience-id", 100);

// Create a new coupon
await createCoupon({
  coupon_code: "SAVE20",
  experience_id: "experience-id",
  type: "percentage",
  discount_value: 20,
  max_uses: 100,
  valid_until: "2024-12-31T23:59:59Z",
});

// Apply a coupon
await applyCoupon("SAVE20", "experience-id", "booking-id");
```

## API Endpoints

### Create Coupon

```bash
POST /functions/v1/create-discount-coupon
Content-Type: application/json

{
  "coupon_code": "SAVE20",
  "experience_id": "uuid",
  "type": "percentage",
  "discount_value": 20,
  "max_uses": 100,
  "valid_until": "2024-12-31T23:59:59Z"
}
```

### Validate Coupon

```bash
POST /functions/v1/validate-discount-coupon
Content-Type: application/json

{
  "coupon_code": "SAVE20",
  "experience_id": "uuid",
  "booking_amount": 100
}
```

### Apply Coupon

```bash
POST /functions/v1/apply-discount-coupon
Content-Type: application/json

{
  "coupon_code": "SAVE20",
  "experience_id": "uuid",
  "booking_id": "uuid"
}
```

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** for coupon management
- **Input validation** and sanitization
- **Usage limits** and expiry date validation
- **Unique coupon codes** per experience
- **CORS headers** properly configured

## Database Policies

- **Public read access** for active coupons (needed for validation)
- **Vendor-only management** for their own experience coupons
- **Admin access** to all coupons
- **Secure function execution** with proper search paths

## Next Steps

1. Run the database migration
2. Deploy the Edge Functions
3. Update your booking flow to include coupon input
4. Add coupon management to vendor dashboard
5. Test the complete flow

The system is now ready to handle discount coupons for your booking platform!
