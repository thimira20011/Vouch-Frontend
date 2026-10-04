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
- `src/features/connections/`: Today, Character, Waiting, Reflection, Letters, Paused, onboarding, profile and vouch screens
- `src/lib/api.ts`: typed fetch helper, timeout, bearer authentication and API error handling
- `src/styles/tokens.css`: initial Vouch design tokens
- `src/styles/index.css`: global and starter styles

## Authentication preview

The default screen is sign-in. Signup collects account details, then campus details; an invitation variant is also available. Preview routes: `#sign-in`, `#sign-up`, `#campus`, `#invitation`.

Validation covers required fields, email syntax, signup university-email domains (.ac.lk plus exact domains configured in `VITE_APPROVED_UNIVERSITY_DOMAINS`), the specified 8–128-character password policy (uppercase, lowercase, digit), academic years 1–7, and required invitation codes. Email ownership, final domain approval and invitation validity need server verification. Campus options are illustrative review data in `campusOptions.ts`; replace them with the backend catalogue.

With no API configured, submissions validate locally and display a status message. Configure `VITE_API_BASE_URL` to enable real registration/login and the connected screens. Signup drafts remain in component memory between steps; credentials and bearer tokens are not persisted to browser storage. A page refresh therefore requires signing in again. Registration uses `FullName`, `Email`, `Password`, `CampusCode`, `Faculty`, `Department`, numeric `AcademicYear`, and optional `InviteToken`.

## Connection screens and design preview

From sign-in, choose **Explore the design preview**, or open `/?preview=1#today`. Preview mode uses the Figma sample profiles and letters; it never sends API requests. Preview choices and unsent letter drafts last for the current page session. Leaving a preview conversation and reopening it restores the example letters.

| Route | Screen |
|---|---|
| `#today` | Daily introduction; reflection or incubation when appropriate |
| `#character` | Character card, peer endorsements, accept/pass, report/block |
| `#waiting` | One-sided acceptance; mutual acceptance opens letters |
| `#reflection` | No-match or passed-introduction reflection |
| `#letters` | Conversation selection, letter history and composer |
| `#paused` | Paused conversation; resume action for the person who paused |
| `#onboarding` | 1–5 deep values, 1–5 interests, optional 280-character bio |
| `#profile` | Personal character card, peer vouches, account ID, optional photo upload |
| `#vouch` | Vouch submission using a peer's shared account ID |

The first six screens adapt the desktop and mobile Figma frames. Onboarding, personal profile, vouching and safety dialogs extend the same tokens and typography with accessible native controls. Navigation works with browser Back/Forward, shows the current section, and moves focus to the new heading. Phone navigation sits outside the scrollable reading viewport. Letter drafts survive failed sends, pause/resume and navigation between sections, and remain only in memory.

## Connecting the backend

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend origin, such as `http://localhost:5000`. Restart Vite after changing environment variables. Start the backend using its own documented configuration; its CORS allow-list must include the exact frontend origin. This frontend change does not modify, start, migrate or provision the backend.

Live mode connects login, registration, onboarding, daily matches, accept/pass, own/matched-user vouches, conversation/message pagination, sending letters, pause/resume, icebreakers, report/block and photo upload. Preview remains available with `?preview=1`, even with an API configured. Protected screen routes without an in-memory session show a sign-in prompt.

### Current API boundaries

- Match responses do not include campus name, academic year or photo; live views show returned faculty/department and an initials fallback. Figma sample details are used only in preview.
- The response flag from `/matches/{id}/respond` can indicate mutual acceptance too early. The frontend reads `/matches/today` after responding and checks its saved status. A confirmed acceptance is retained in memory so a failed follow-up read cannot resubmit it.
- The API does not expose a user's prior onboarding selections or a peer directory. The personal profile shows details saved during this frontend session; vouching uses an account ID shared by the peer. A full profile edit/directory flow needs additional backend reads.
- The current daily-match contract doesn't expose which participant has already accepted. The waiting choice lasts for this page session; robust restoration across logins needs that field from the backend.
- Letters and waiting refresh every 20 seconds while the tab is visible. SignalR push updates are not connected yet. Icebreaker failure does not prevent writing a letter.
- Moderation/admin, invitation management, account deletion and full settings screens remain future work.

## Checks

```sh
npm run typecheck
npm run build
npm test
```

Browser tests use installed Microsoft Edge. They cover authentication, onboarding, accept/pass, draft retention, pause/resume, safety dialogs and responsive layouts at 375, 390, 768 and 1440 pixels, plus landscape and reduced motion. API flow tests use intercepted contract-shaped responses, not a running backend or database. Test servers run on ports 5175 (preview) and 5176 (API configured). Screenshots are saved under the ignored `test-results/` directory.

Design reference: https://www.figma.com/design/ZBzLM8HfRsC5KGH59o3Dpo/Vouch?node-id=0-1
