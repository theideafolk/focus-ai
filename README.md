# FocusAI Project Management Application

A project management application designed to help with task prioritization and project organization.

## Features

- Project management with priority calculation
- Task organization and sequencing
- Smart priority scoring system based on multiple factors
- Currency selection (USD/INR/GBP)
- Project type categorization
- Timeline tracking with recurring project support
- Notes and documentation capabilities
- User settings and preferences

## Database Migrations

To apply database migrations, go to your Supabase dashboard and execute the SQL scripts located in the `supabase/migrations` directory.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Environment Variables

The application requires the following environment variables:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Project Structure

- `/src` - Application source code
  - `/components` - Reusable UI components
  - `/contexts` - React context providers
  - `/lib` - Library code and utilities
  - `/pages` - Application pages
  - `/services` - API services
  - `/types` - TypeScript type definitions
  - `/utils` - Utility functions
- `/public` - Static assets
- `/supabase` - Supabase configuration and migrations