# Tonline Airdrop

## Overview

Tonline Airdrop is a Telegram Mini App (TWA) built with Next.js for managing cryptocurrency airdrop campaigns on the TON blockchain. The application allows users to check eligibility, earn points through check-ins and referrals, and track their TON balance. It's designed to run within the Telegram mobile app environment using the Telegram Web App SDK.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Next.js 16** with App Router - Chosen for its built-in routing, server-side capabilities, and excellent React integration
- **TypeScript** - For type safety across the codebase
- **React 18** - Component-based UI architecture

### UI/Styling
- **Tailwind CSS** - Utility-first CSS framework with custom TON brand colors (ton-blue: #0088CC, ton-dark: #006699)
- **shadcn/ui** - Component library configured with "new-york" style and Radix UI primitives
- **Framer Motion** - For smooth animations and transitions
- **Lucide React** - Icon library

### State Management
- **TanStack React Query** - For server state management and data fetching
- Component-level state with React hooks for local UI state

### Telegram Integration
- **@twa-dev/sdk** - Telegram Web App SDK for accessing Telegram user data and native features
- Telegram Web App script loaded via Next.js Script component with "beforeInteractive" strategy
- WebApp.ready() called on mount to signal app readiness to Telegram

### Monetization
- **Adsgram SDK** - Ad integration for rewarded advertisements (zone-based configuration in lib/adsgram.ts)

### Database
- **Supabase** - Backend-as-a-Service for database and authentication
- **Drizzle ORM** - SQL toolkit configured for PostgreSQL
- Schema defined in shared/schema.ts, migrations output to ./migrations

### Key Design Patterns
- Client-side rendering with 'use client' directives
- Custom 3D button and card styles for mobile-optimized touch interactions
- Dark theme by default optimized for Telegram's interface
- Mobile-first responsive design (max-w-md container)

## External Dependencies

### Database & Backend
- **Supabase** - PostgreSQL database with real-time capabilities
  - Requires `NEXT_PUBLIC_SUPABASE_URL` environment variable
  - Requires `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variable
  - Requires `DATABASE_URL` for Drizzle ORM migrations

### Third-Party Services
- **Telegram Web App API** - User authentication and native Telegram features
- **Adsgram** - Rewarded ad network (requires zone ID configuration in lib/adsgram.ts)

### NPM Dependencies
- UI: @radix-ui/react-accordion, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-tabs
- Utilities: clsx, tailwind-merge, date-fns, zod
- Animation: framer-motion