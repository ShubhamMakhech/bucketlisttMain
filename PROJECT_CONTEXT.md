# BucketListt – Full Project Context (for Cursor / handoff)

Use this document when switching Cursor accounts or onboarding someone new so they have full context of the project.

---

## 1. What This Project Is

**BucketListt** is a **travel/experiences booking platform** (bucket-list experiences). It’s a **React SPA** with:

- **Customers**: Browse destinations/experiences, book, pay (Razorpay), manage favorites & bookings.
- **Vendors**: Create/edit experiences, manage calendar, view bookings.
- **Agents**: Agent-specific flows (e.g. agent bookings).
- **Admin**: Blog management, users, discount coupons, etc.

Deployment: **Vercel** (SPA rewrites to `index.html`). Backend: **Supabase** (Postgres, Auth, Edge Functions, Storage).

---

## 2. Tech Stack

| Layer            | Tech                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| **Framework**    | React 18, TypeScript                                                      |
| **Build**        | Vite 5 (port 8080, host `::`)                                             |
| **Routing**      | React Router v6                                                           |
| **Styling**      | Tailwind CSS, shadcn/ui (Radix), Framer Motion, GSAP                      |
| **State / Data** | React Query (TanStack), AuthContext                                       |
| **Backend**      | Supabase (Auth, Postgres, Edge Functions, Storage)                        |
| **Payments**     | Razorpay                                                                  |
| **Auth**         | Supabase Auth + OTP (email via Resend, SMS via MSG91), Google OAuth       |
| **AI**           | Groq API (AI chatbot on homepage)                                         |
| **Other**        | React Hook Form + Zod, Recharts, html2pdf/jspdf, QR codes, dayjs/date-fns |

Package managers: **npm / pnpm / bun** (lockfiles present). Use one consistently.

---

## 3. Repo Structure (high level)

```
bucketlisttMain/
├── src/
│   ├── App.tsx                 # Routes, providers, conditional layout (WhatsApp, mobile CTA)
│   ├── main.tsx
│   ├── index.css
│   ├── App.css
│   ├── components/             # UI + feature components (Layout, BookingDialog, AIChatbot, etc.)
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state, signIn/signUp/OTP/signOut, roles
│   ├── hooks/                  # useRazorpay, useFavorites, useAIChat, useDiscountCoupon, etc.
│   ├── integrations/supabase/ # client.ts, types.ts (DB types)
│   ├── lib/                    # utils, colors
│   ├── pages/                  # One file per route (Index, Auth, ExperienceDetail, Bookings, etc.)
│   ├── Styles/                 # Extra CSS
│   ├── data/                   # e.g. detailed-itineraries.json
│   └── utils/                  # generateInvoicePdf, sitemap, whatsappUtil, etc.
├── supabase/
│   ├── config.toml
│   ├── functions/              # Edge Functions (send-otp, verify-otp, Razorpay, coupons, etc.)
│   └── migrations/             # SQL migrations (tables, RLS, triggers)
├── public/                     # Static assets, favicon, images
├── vite.config.ts              # @ alias "@/" -> src, dev port 8080
├── tailwind.config.ts
├── tsconfig*.json
├── vercel.json                 # SPA rewrite to index.html
├── .gitIgnore                  # .env, .env.*.local ignored
└── *.md                        # README, OTP, discount, vendor, SEO docs
```

---

## 4. Routes (from App.tsx)

| Path                   | Page / Component   | Note                                        |
| ---------------------- | ------------------ | ------------------------------------------- |
| `/`                    | Index              | Homepage; AI chatbot, WhatsApp CTA          |
| `/auth`                | Auth               | Login/signup (OTP, password, Google)        |
| `/email-confirmation`  | EmailConfirmation  | Post-email verification                     |
| `/blogs`               | Blogs              | Blog listing                                |
| `/blogs/:slug`         | BlogDetail         | Single blog                                 |
| `/admin/blogs`         | AdminBlogPage      | Admin blog management                       |
| `/qrcode`              | QRCodeRedirect     | QR redirect handler                         |
| `/destinations`        | Destinations       | Destination listing                         |
| `/destination/:name`   | DestinationDetail  | Single destination                          |
| `/experience/:name`    | ExperienceDetail   | Experience detail; mobile floating CTA here |
| `/search`              | SearchResults      | Search results                              |
| `/favorites`           | Favorites          | User favorites                              |
| `/profile`             | Profile            | User profile                                |
| `/profile/calendar`    | VendorCalendarPage | Vendor calendar                             |
| `/bookings`            | Bookings           | User bookings                               |
| `/confirm-booking`     | ConfirmBooking     | Booking confirmation                        |
| `/create-experience`   | CreateExperience   | Vendor: create experience                   |
| `/edit-experience/:id` | EditExperience     | Vendor: edit experience                     |
| `/contact`             | ContactUs          | Contact page                                |
| `/our-story`           | OurStory           | About                                       |
| `/terms`               | TermsAndConditions | T&C                                         |
| `/coming-soon`         | ComingSoon         | Placeholder                                 |
| `/users`               | Users              | User management (admin)                     |
| `/partner`             | Partner            | Partner page                                |
| `/vendor/experiences`  | VendorExperiences  | Vendor experience list                      |
| `*`                    | NotFound           | 404                                         |

Guards: **VendorRouteGuard**, **AgentRouteGuard** wrap the app for role-based access.

---

## 5. Authentication

- **AuthContext** (`src/contexts/AuthContext.tsx`): `user`, `session`, `loading`, and methods:
  - `signIn`, `signUp`, `signOut`
  - `sendOTP`, `verifyOTP`, `signInWithOTP`, `signUpWithOTP`
  - `resetPassword`, `updatePassword`
- **Roles**: `customer` | `vendor` | `agent` (stored in profile; used by guards).
- **OTP**: One input (email or phone); OTP sent via Edge Functions:
  - Email: Resend
  - SMS: MSG91
- **Google OAuth**: Redirect flow; after login, redirect back to `loggedInPath` from `localStorage` (see `checkLoggedInPathVsCurerntPath` in App.tsx).
- **Session**: Supabase Auth; Edge Functions use `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY` where appropriate).

Detailed flows: **OTP_AUTHENTICATION_README.md**, **OTP_AUTHENTICATION_IMPLEMENTATION.md**, **AUTHENTICATION_ANALYSIS.md**.

---

## 6. Backend (Supabase)

### 6.1 Client

- **File**: `src/integrations/supabase/client.ts`
- Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (with fallback defaults in code; prefer env in production).
- Typed with `Database` from `src/integrations/supabase/types.ts`.

### 6.2 Main tables (from types)

- **profiles**: User profiles (roles, names, phone, logo, etc.)
- **experiences**: Vendor experiences (title, description, pricing, images, url_name, etc.)
- **activities**: Activities under an experience (price, discounted_price, duration, etc.)
- **destinations**, **attractions**: Destination/attraction data
- **bookings**, **booking_participants**: Bookings and participants
- **time_slots**: Slots for experiences
- **discount_coupons**: Coupon codes (per experience, flat/percentage, validity)
- **otp_verifications**: OTP storage for auth
- **booking_invoices**: Invoice storage
- **blogs** (or similar): Blog content
- **logs** / **booking_logs**: Auditing / cancellation notes

RLS and migrations are in **supabase/migrations/**.

### 6.3 Edge Functions (supabase/functions/)

| Function                              | Purpose                                |
| ------------------------------------- | -------------------------------------- |
| send-otp                              | Generate & send OTP (email/SMS)        |
| verify-otp                            | Verify OTP                             |
| signin-with-otp                       | Sign in with OTP                       |
| signup-with-otp                       | Sign up with OTP                       |
| send-password-reset                   | Password reset email                   |
| verify-password-reset                 | Verify reset token                     |
| check-user-exists                     | Check if user exists (e.g. before OTP) |
| get-time-slots                        | Time slot availability for booking     |
| create-razorpay-order                 | Create Razorpay order for payment      |
| send-booking-confirmation             | Post-booking email/notification        |
| send-whatsapp-message                 | WhatsApp notification (uses MSG91)     |
| create/validate/apply-discount-coupon | Discount coupon lifecycle              |
| manage-experience                     | Create/update experience               |
| update-user-email                     | Update user email                      |
| create-discount-coupon                | Admin: create coupon                   |

Edge Functions expect Supabase env vars (e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`); some use `VITE_WHATSAPP_MSG91` (or similar) for WhatsApp.

---

## 7. Environment Variables

Create a **.env** (or .env.local) in project root. It is **gitignored**.

**Frontend (Vite):**

- `VITE_SUPABASE_URL` – Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – Supabase anon/public key
- `VITE_RAZORPAY_KEY_ID` – Razorpay key (used in BookingDialog, BulkBookingPaymentDialog)
- `VITE_GROQ_API_KEY` – Groq API for AI chatbot (useAIChat.tsx)
- Any other `VITE_*` used in the app (e.g. WhatsApp-related if exposed to client)

**Supabase Edge Functions** (set in Supabase dashboard):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (and `SUPABASE_ANON_KEY` where used)
- Resend / MSG91 / WhatsApp keys as required by send-otp, send-whatsapp-message, etc.

README mentions copying from `.env.example`; if that file is missing, create it from the list above.

---

## 8. Key Features & Where They Live

- **Booking flow**: **BookingDialog** (and **BulkBookingPaymentDialog**), **ConfirmBooking**; time slots from **get-time-slots**; payment via **Razorpay** (useRazorpay hook).
- **Discount coupons**: **useDiscountCoupon**; Edge Functions create/validate/apply; **DISCOUNT_COUPON_SETUP.md**.
- **Favorites**: **useFavorites** hook.
- **Vendor calendar**: **VendorCalendarPage**; vendor routes guarded by **VendorRouteGuard**.
- **Agent flows**: **AgentRouteGuard**; agent booking flag (e.g. `isAgentBooking`) in bookings.
- **AI chatbot**: **AIChatbot** on homepage; **useAIChat** with Groq.
- **WhatsApp**: **WhatsAppButton** (homepage only); **send-whatsapp-message** Edge Function; **whatsappUtil**.
- **Invoices/PDF**: **generateInvoicePdf** (e.g. jspdf/html2pdf).
- **Blogs**: **Blogs**, **BlogDetail**, **AdminBlogPage**.
- **SEO**: **SEO_IMPROVEMENTS_SUMMARY.md**, sitemap/utils in **utils/**.

---

## 9. How to Run

```bash
# Install (pick one)
npm install
# or pnpm install
# or bun install

# Env: copy .env.example to .env and fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.

# Dev
npm run dev
# App: http://localhost:8080

# Build
npm run build

# Preview production build
npm run preview
```

Lint: `npm run lint`.

---

## 10. Important Docs in Repo

- **README.md** – Quick start, scripts, structure
- **OTP_AUTHENTICATION_README.md** – OTP auth flow and Edge Functions
- **OTP_AUTHENTICATION_IMPLEMENTATION.md** – Implementation details
- **AUTHENTICATION_ANALYSIS.md** – Auth design/analysis
- **DISCOUNT_COUPON_SETUP.md** – Discount coupon DB + Edge Functions
- **VENDOR_BOOKING_ANALYSIS.md** – Vendor booking flow and “My Bookings”
- **CORS_FIX_SEND_OTP.md**, **MSG91_OTP_TEMPLATE_FIX.md** – OTP/CORS/template fixes
- **SCROLL_ANIMATIONS.md** – Scroll animation behavior
- **SEO_IMPROVEMENTS_SUMMARY.md** – SEO setup

---

## 11. Conventions & Patterns

- **Path alias**: `@/` → `src/` (use in imports).
- **UI**: shadcn/ui + Tailwind; theme via **ThemeProvider** (e.g. `bucketlistt-ui-theme-v2`).
- **Forms**: React Hook Form + Zod where used (e.g. booking, auth).
- **Data fetching**: React Query (e.g. experiences, activities, time slots in App and pages).
- **Auth**: Always via AuthContext; protect routes with VendorRouteGuard / AgentRouteGuard.
- **Payments**: Razorpay; key from `VITE_RAZORPAY_KEY_ID` with fallback in code (avoid committing real keys).

---

## 12. Handoff Checklist for New Cursor Account

1. Clone repo and install deps (`npm install` or pnpm/bun).
2. Create `.env` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_RAZORPAY_KEY_ID`, `VITE_GROQ_API_KEY`.
3. Run `npm run dev` and open http://localhost:8080.
4. Skim **App.tsx** (routes + guards + conditional layout).
5. Skim **AuthContext** and **OTP_AUTHENTICATION_README.md** for auth.
6. Use **PROJECT_CONTEXT.md** (this file) as the single reference for structure, routes, backend, and env.
7. For Supabase: ensure Edge Function secrets are set in dashboard; run migrations if DB is fresh.

---

_Last updated for repo state as of project layout and key files reviewed. Adjust env or paths if your setup differs._
