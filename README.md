# Suit Society

Production-grade luxury ecommerce platform for **Suit Society**, Raigarh — built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + shadcn/ui components
- **Framer Motion**
- **Supabase** (Database, Storage)
- **Razorpay** (Prepaid payments only)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. First-run setup screen

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If environment variables are missing, you'll be redirected to `/setup` to enter:

- Supabase URL
- Supabase Anon Key
- Supabase Service Role Key
- Razorpay Key ID
- Razorpay Key Secret

### 3. Configure Supabase database

Run `supabase/schema.sql` in your Supabase SQL Editor.

Create storage buckets in Supabase Dashboard:
- `products` (public)
- `banners` (public)
- `videos` (public)

### 4. Admin login

- **URL:** `/admin/login`
- **Username:** `SUiTsOcIety`
- **Password:** `SuitXSociety@123897254`

Change credentials from **Admin → Settings** after first login.

### 5. Build for production

```bash
npm run build
npm start
```

## Features

### Customer Storefront
- Luxury homepage with hero carousel, banners, videos, flash sales
- Product listing with filters, sorting, instant search
- Product detail with gallery, zoom, reviews, wishlist
- Phone OTP authentication
- Razorpay checkout (COD disabled)
- Coupon codes at checkout
- Order tracking & account management

### Admin Panel (`/admin`)
- Dashboard analytics & reports
- Products CRUD with auto barcode generation
- Categories, brands, fabrics management
- Inventory with barcode search
- Orders management & invoices
- Flash sales & product discounts
- Coupon management
- Hero, banners, videos, happy customers gallery
- Excel product import
- Settings (change admin credentials)

## Business Details

- **Brand:** Suit Society
- **Email:** suitsocietyofficial@gmail.com
- **Phone:** 07974100362
- **Address:** Kewdabadi Bus Stand Road, Near SBI Bank Chowk Channel, Raigarh, Chhattisgarh - 496001

## Project Structure

```
src/
├── app/           # Pages & API routes
├── actions/       # Server actions
├── components/    # UI components
├── context/       # Cart & wishlist state
├── lib/           # Utilities, auth, Supabase
└── types/         # TypeScript types
supabase/
└── schema.sql     # Database schema
```

## License

Private — Suit Society
