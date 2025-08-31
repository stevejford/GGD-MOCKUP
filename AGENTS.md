# AGENTS.md

A simple, open format for guiding coding agents. Think of AGENTS.md as a README for agents: a dedicated, predictable place to provide the context and instructions to help AI coding agents work on this project.

This repository uses Next.js (App Router) with TypeScript and Tailwind CSS.

## Project brief: Premium B2B Garage Door Supplier Homepage Redesign

1. Project Title: Premium B2B Garage Door Supplier Homepage Redesign
2. Project Goal:
   - Design and develop a modern, professional, architecturally appealing homepage for a premium B2B garage door supplier.
   - Create a strong brand presence, articulate value for trade professionals, showcase product quality/solutions, build trust, and drive lead generation via clear CTAs.
3. Target Audience:
   - Architects
   - Builders & Developers
   - Trade Professionals (installers, contractors)
   - Commercial Property Managers
4. Key Objectives:
   - Establish a strong, premium brand image rooted in the established identity
   - Present comprehensive solutions for trade professionals
   - Showcase curated, high‑quality products and capabilities
   - Build credibility through partner logos and testimonials
   - Facilitate access to a "Trade Portal" and a prominent "Request a Quote" CTA
   - Improve UX (navigation, hierarchy, responsiveness) and UI (visual polish)
   - Increase inquiries and lead generation
5. Design Aesthetic & Principles:
   - Aesthetic: clean, modern, professional, architectural, spacious
   - UX/UI: intuitive navigation, clear hierarchy, mobile‑first responsiveness, accessible typography, engaging visuals
6. Brand Colors (strict usage):
   - Primary: Deep Blue (#2C3993)
   - Action: Vibrant Orange (#F88229)
   - Text: Charcoal Gray (#333333)
   - Background: Off‑White / Light Grey (#F9F9F9)
   - Neutral: White (#FFFFFF, especially for text on dark backgrounds)
   - Logo‑only: Heritage Red (#901C3B) — only for the "Geelong" word in the full‑color primary logo
7. Key Homepage Sections & Content (top → bottom):
   - Header
     - Solid Deep Blue background
     - Left: reversed (all‑white) logo
     - Center: white nav links: Solutions, Products, Resources
     - Right: solid Vibrant Orange "Trade Portal" button
   - Hero Section
     - Large, dramatic, high‑quality architectural home image with integrated garage door
     - Subtle transparent‑to‑black gradient overlay for text readability
     - Bold white headline: "Premium Garage Door Solutions Engineered for Trade Excellence."
     - Prominent Vibrant Orange CTA: "Request a Quote"
   - Brand Trust Bar
     - Off‑white bar with grayscale partner logos (e.g., B&D, Steel‑Line, Gliderol, Danmar Doors)
   - Solutions for Professionals
     - Title: "Solutions for Professionals"
     - Three‑column layout; each column: professional photo, Deep Blue headline, short charcoal paragraph, Vibrant Orange button
   - Featured Products / Capabilities
     - Four‑item grid; each item: clean photo + simple charcoal title (e.g., Custom Manufacturing, Architectural Doors, Industrial Solutions, Smart Systems Integration)
   - Our Work
     - Title: "Our Work" with a horizontal row of three project image cards showcasing completed installations
   - Testimonial
     - Full‑width section with solid Deep Blue background; large centered white quote; name/company in white below
   - Final Call‑to‑Action
     - Bold block with large Deep Blue headline, short charcoal sentence, and unmissable Vibrant Orange button
   - Footer
     - Dark Deep Blue background; four columns with white text; links (Service Areas, About Us, Contact) and contact info


## Design workflow
- Design source of truth: Figma component library and tokens
- Keep UI in sync with Figma; avoid ad‑hoc styles outside globals.css/atoms
- Reuse components; prefer composition over duplication

## Framework & runtime conventions
- Prefer Server Components for static content in the App Router
- Default to Static Site Generation (SSG) where possible; use SSR only when required
- colocate segment-specific components under `src/app/<route>/components`

## Performance & accessibility
- Use `next/image` with responsive sizes and modern formats; target LCP < 2.5s
- Lazy‑load non‑critical media; prefetch critical above‑the‑fold assets only
- One H1 per page; meaningful alt text; maintain WCAG AA contrast
- Ensure visible focus states and full keyboard navigation on all interactive elements

## Auth guidance
- Primary auth: Clerk (custom login pages acceptable)
- Secondary option: NextAuth.js only if required by scope
- Do not remove or weaken `src/middleware.ts` Clerk middleware without review

## SEO ops checklist
- Add/maintain canonical URLs via the Metadata API
- Update `sitemap.ts` and `robots.ts` whenever new routes are added
- Include JSON‑LD (LocalBusiness, Breadcrumb) for service and location pages
- Use descriptive titles and ~150–160 char meta descriptions

## CMS integration (optional / future)
- If introducing a headless CMS, prefer Sanity, Strapi, or Contentful
- Model content types to match the service‑area silo structure (location, services, nearby areas, CTAs)


## Setup commands
- Install deps: `npm install`
- Start dev server: `npm run dev` (Next.js chooses an available port; if 3000 is busy it will run on 3001/3002)
- Build: `npm run build`
- Start production server: `npm run start`
- Lint: `npm run lint`

## Code style
- TypeScript strict mode is enabled in tsconfig.json
- Prefer single quotes, no semicolons (project currently relies on ESLint defaults; keep formatting consistent with existing files)
- Functional React components and hooks
- Keep components small and composable; colocate UI under `src/components`

## Project layout
- App Router pages live in `src/app`
- Shared components: `src/components`
- Utilities and types: `src/lib`, `src/types`
- SEO helpers: `src/components/seo`

## Testing/validation
- There is no test runner configured yet. Prefer adding Vitest if tests are requested.
- Safe verification steps before opening PRs:
  - `npm run build` to ensure type-checks and Next.js build succeed
  - `npm run lint` to satisfy ESLint rules

## Dev environment tips
- Next.js App Router with Turbopack is enabled; hot reload is on by default
- Use absolute imports via `@/*` (configured in tsconfig paths)
- Public assets live in `/public`

## Design styles
- Brand colors (defined in globals.css under @theme inline):
  - deep-blue: #2C3993
  - deep-blue-hover: #1e2870
  - deep-blue-light: #e1ecf8
  - vibrant-orange: #F88229
  - vibrant-orange-hover: #e6741f
  - vibrant-orange-light: #fef3e8
  - charcoal: #333333
  - heritage-red: #901C3B
- Typography:
  - Default sans font via CSS variable `--font-geist-sans`
  - Use bold weights for H1/H2; maintain one H1 per page
- Spacing and layout:
  - Container max-width: 1440px (use class `max-w-container`)
  - Horizontal padding utility: `px-container`
- Utility classes (mirroring Tailwind): common helpers defined in globals.css such as bg-deep-blue, text-deep-blue, text-heritage-red, text-deep-blue-light, text-vibrant-orange, border-deep-blue-light, etc.

## Domain guidance (GGD project)
- Default dev URL is http://localhost:3001 when port 3000 is taken. Keep the dev server running so stakeholders can preview changes in real time.
- Phone number to display in UI and schema: `(03) 5221 9222`
- Operational SLAs to reflect in copy:
  - New doors: 5–6 weeks from date of order
  - Emergency jobs: same day or next day depending on volume
  - Offer yearly service jobs (maintenance)

## Content and SEO conventions
- Use the Metadata API for titles/descriptions
- Prefer structured heading hierarchy: one H1 per page, followed by H2/H3
- Include JSON-LD for LocalBusiness and Breadcrumbs when relevant
- Service areas follow `/service-areas/[slug]` with location-specific content and internal links to products and adjacent areas

## PR instructions
- Title format: `[GGD] <short description>`
- Always run `npm run lint` and ensure the app builds locally before committing
- Add or update tests if a test suite is introduced

## Security considerations
- Do not commit secrets; environment variables belong in `.env.local`
- Clerk auth is present in the repo; verify middleware remains intact when editing `src/middleware.ts`

## Large changes
- For multi-file or cross-layer changes, create a minimal plan first and proceed in small, verifiable steps. Keep edits conservative and avoid refactors that are not required by the task.

