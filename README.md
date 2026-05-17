# 🏢 PropZen

A premium, cross-platform property management web application built with Next.js and Supabase.

## 🚀 Features

- **Dashboard**: Real-time insights into your portfolio performance.
- **Property Management**: Complete CRUD for apartments, villas, and commercial spaces.
- **Tenant Management**: Track residents, contact details, and lease history.
- **Financial Tracking**: Generate and monitor invoices and payments.
- **Responsive Design**: Premium glassmorphic UI that works perfectly on mobile and desktop.
- **Supabase Integration**: Secure authentication and real-time database.

## 🛠 Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Database**: [Supabase](https://supabase.com/)
- **Styling**: Vanilla CSS with modern Design Tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: TypeScript

## 🏁 Getting Started

### 1. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 2. Database Configuration
Run the SQL schema provided in `SUPABASE_SCHEMA.sql` in your Supabase SQL Editor.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Locally
```bash
npm run dev
```

## 📱 Mobile Installation (PWA)
To use this on your iPhone:
1. Navigate to your deployed URL in Safari.
2. Tap the **Share** button.
3. Select **"Add to Home Screen"**.

## 📄 License
MIT
