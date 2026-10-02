# Vouch Frontend

React + TypeScript + Vite frontend for Vouch — Considered Connections.

## Development

Requires Node.js 22 or later.

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

## Structure

- `src/main.tsx`: React entry point, with locally bundled Inter and Cormorant Garamond fonts
- `src/App.tsx`: authentication entry point
- `src/components/`: reusable buttons and form fields
- `src/features/auth/`: responsive authentication screens, validation and typed form models
- `src/styles/tokens.css`: initial Vouch design tokens
- `src/styles/index.css`: global and starter styles

## Authentication preview

The default screen is sign-in. Signup collects account details, then campus details; an invitation variant is also available. Preview routes: `#sign-in`, `#sign-up`, `#campus`, `#invitation`.

Validation covers required fields, email syntax, signup university-email domains (.ac.lk plus exact domains configured in `VITE_APPROVED_UNIVERSITY_DOMAINS`), the specified 8–128-character password policy (uppercase, lowercase, digit), academic years 1–7, and required invitation codes. Email ownership, final domain approval and invitation validity need server verification. Campus options are illustrative review data in `campusOptions.ts`; replace them with the backend catalogue.

Submissions currently validate locally and display a status message. No accounts are created and no credentials are sent or persisted. Signup drafts remain in component memory between steps. Backend integration and authenticated screens are a later task. The documented registration payload will use `FullName`, `Email`, `Password`, `CampusCode`, `Faculty`, `Department`, numeric `AcademicYear`, and optional `InviteToken`.

## Checks

```sh
npm run typecheck
npm run build
npm test
```

Browser tests use installed Microsoft Edge. They cover validation, password reveal, signup navigation, invitation handling, and responsive layouts. Screenshots are saved under the ignored `test-results/` directory.

Design reference: https://www.figma.com/design/ZBzLM8HfRsC5KGH59o3Dpo/Vouch?node-id=0-1
