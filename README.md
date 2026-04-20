# TaraCSE

TaraCSE is a web application created for civil service exam candidates who need a focused and reliable study platform. It delivers structured practice, timed mock exams, and performance analytics to reduce uncertainty and improve preparation efficiency.

## Problem Statement

Many CSE candidates rely on static review materials, unsupported practice questions, and unstructured study routines. TaraCSE addresses this by providing a single web app that:

- simulates real exam conditions
- tracks progress across topics
- identifies weak areas with analytics
- explains answers with rationale
- reduces reliance on informal or outdated materials

## Features

### Practice Mode

- Untimed, topic-focused practice sessions
- immediate answer validation and feedback
- daily question limits for consistent study habits

### Mock Exam Mode

- full-length exams with a timer
- exam conditions simulated in the browser
- results and review after completion

### Analytics and Performance

- score tracking and trend insights
- subject-level performance breakdowns
- weak-spot detection for targeted review

### AI Explanations

- contextual answer explanations for each question
- rationale designed to reinforce understanding, not just memorization

### Subscription Model

- free access for introductory practice
- premium upgrade unlocks unlimited mock exams, advanced analytics, and a full question bank

### User Experience

- account login and registration
- dashboard access for personal progress
- policy pages for terms of service and privacy
- admin verification and premium upgrade workflow

## Technology Stack

| Layer | Technology | Purpose |
| ----- | ---------- | ------- |
| Framework | Next.js 16 | App routing, server rendering, page structure |
| UI | Tailwind CSS 4 | Styling and responsive design |
| Language | TypeScript | Type safety and developer tooling |
| Data & Auth | Supabase JS | Authentication and backend integration |
| Components | ShadCN UI, Radix UI | Reusable UI primitives |
| Interaction | Framer Motion | Animations and motion effects |
| Icons | Lucide React | Vector iconography |

## Setup

### Prerequisites

- Node.js 20 or later
- npm
- Supabase project for authentication and data access

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Additional environment values may be needed depending on your Supabase or deployment setup.

## Development

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in the browser.

## Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Notes

- The app uses the Next.js App Router.
- Placeholder images and sample text are for demonstration and can be replaced with production assets.
- Verify Supabase credentials and project settings before deployment.
