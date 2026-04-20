# TaraCSE

TaraCSE is a web application designed to help civil service exam candidates prepare with adaptive practice, timed mock exams, and performance analytics. It combines an interactive learning experience with data-driven insights to help users identify strengths, target weaknesses, and improve readiness.

## Key Features

- Practice Mode with instant feedback and self-paced review
- Full-length Mock Exam Mode with a timed exam environment
- Performance analytics across subject areas, score trends, and weak-spot tracking
- AI-generated explanations to help users understand the reasoning behind each answer
- Free and premium plan structure for incremental access to advanced content
- User accounts with login, registration, and dashboard access
- Admin verification screens and upgrade workflows for premium access management
- Policy pages for Terms of Service and Privacy Policy

## Technology Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase JS for authentication and backend data access
- ShadCN UI and Radix UI primitives
- Framer Motion for interface animation
- Lucide icons

## Project Structure

- `app/` – Next.js app routes and page components
- `app/(auth)/` – authentication layouts and actions
- `app/dashboard/` – authenticated user dashboard pages
- `app/dashboard/practice/` – practice sessions and review routes
- `app/dashboard/mock/` – mock exam workflow and results
- `app/dashboard/analytics/` – analytics and performance reporting
- `app/dashboard/leaderboard/` – leaderboard view
- `app/admin/verifications/` – admin verification and upgrade flows
- `app/terms/page.tsx` – Terms of Service page
- `app/privacy/page.tsx` – Privacy Policy page

## Routes

- `/` – landing page
- `/login` – login page
- `/register` – registration page
- `/dashboard` – main user dashboard
- `/dashboard/practice` – practice center
- `/dashboard/mock` – mock exam center
- `/dashboard/analytics` – performance analytics
- `/dashboard/leaderboard` – leaderboard
- `/pricing` – pricing overview
- `/terms` – terms of service
- `/privacy` – privacy policy
- `/admin/verifications` – verification workflow

## Setup and Local Development

### Prerequisites

- Node.js 20+ recommended
- npm installed
- Supabase project for authentication and data storage

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the project root and provide the Supabase settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

If your application requires additional environment values, add them to the same file.

### Run the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Build for production

```bash
npm run build
```

### Start production server

```bash
npm start
```

## Notes

- This repository is configured for a Next.js App Router project.
- The user interface is built with reusable components and responsive layout utilities.
- Placeholder images and illustrative graphics in the application are examples and may be replaced with final assets.

## Contribution

For improvements or updates, edit the relevant files in `app/`, then verify the application behavior locally before committing.
