# Contact Hub frontend

Next.js frontend for the local NestJS Contact Hub PoC.

## Run locally

1. Start Redis, the API gateway (port 3000), user service (3002), upload service (3003), ETL worker, contact service (3005), and share-usage service (3007), with their database configuration.
2. Copy `.env.example` to `.env.local`. `API_GATEWAY_URL` is the gateway origin without `/api`.
3. Run `npm install` if dependencies are missing.
4. Run `npm run dev -- --hostname 0.0.0.0 --port 3001` from `web-app`.
5. Open `http://localhost:3001/login`. On your phone, use `http://<computer-LAN-IP>:3001`.

Browser requests use same-origin `/api`; Next.js forwards them to the gateway. Restart Next.js after changing the gateway environment variable. The frontend and gateway must use different ports. Allow the frontend port through your local firewall for LAN access.

## Implemented workflow

- Login through `/api/users/login` using stored accounts. A backend-issued, eight-hour session token is kept in tab-scoped storage. The User Service validates sessions and administrator roles on all account-management endpoints; passwords are never persisted in browser storage or logged.
- Single `.xlsx` upload, up to and including 50 MiB, multipart field `file`, upload progress, and explicit error states.
- Processing status polling every 2.5 seconds, with cancellation on unmount, terminal-state detection, row counts, and manual retry after status errors.
- Contacts allocation with integer validation (1–2,000), quota display, responsive contact table, allocation expiry, and marking the allocation as contacted.
- Confirmed allocations persist across refreshes in the same tab. A persisted uncertainty marker prevents automatic resubmission after an ambiguous allocation failure.

## Backend differences from the requirements

The frontend reflects the existing backend rather than inventing successful responses:

- The backend currently enforces **2,000 contacts daily**, not the proposed 20,000. Claiming consumes quota. The usage endpoint does not expose a daily-limit field, so its adapter uses the existing backend limit; successful claims supply their own authoritative `dailyUsage` values.
- `requestId` is sent, but the backend currently ignores it. There is no claim lookup/recovery endpoint. An uncertain allocation therefore locks further requests in that tab and asks for administrator recovery; it cannot safely offer a retry. Browser storage is only a local safeguard, not backend idempotency.
- Claims expire and can become available again. Permanent global duplicate prevention requires a backend policy change.
- No global available-contact count endpoint exists. The UI does not present employee-owned availability counts as a global count.
- Upload status uses the backend's existing `succesfulRows` and `errorMeassage` field spellings. Raw internal error messages and file paths are not displayed.

Backend work needed for full requirements: request-ID idempotency and claim recovery, 20,000 daily quota with an explicit quota contract, global available-count endpoint, and the intended permanent allocation policy.

## Verification

Run `npx tsc --noEmit` and `npm run build`.

With the services running, check invalid and successful login; invalid extension, empty and oversized uploads; repeated uploads; each processing terminal state; allocations of 1, 500 and 2,000; rejection of 2,001; empty allocations; quota exhaustion; refresh recovery; and loss of connectivity during allocation. Confirm an uncertain allocation cannot be submitted again. Check mobile navigation and table scrolling on a phone over the LAN.

The production build and TypeScript checks do not establish end-to-end backend behavior. Real quota enforcement, uniqueness, and recovery must be verified against running services.

## Contacted history

Open `/contacts/contacted`, or choose **Contacted history** from the Contacts tabs. Records come from `GET /api/contacts/contacted?employeeId=1&page=1&search=...` through the existing gateway route. Restart the contact service after pulling this endpoint change.

History is read from the database, restricted to `CONTACTED` records whose `contactedByEmployeeId` matches the selected employee. Results are sorted newest first and paginated at 25 records. Search matches name, email, phone, and interest. Contact endpoints still rely on client-supplied employee identity; account-management endpoints now validate backend sessions, but this has not yet been extended to the contact/upload microservices.

The allocation table has local search and 25-row pagination. The history view searches and paginates on the server, so it can show records from older allocations rather than only browser session state.

## Contact statistics

Open `/contacts/stats` from the **Statistics** tab. The selected employee's completed outreach is loaded from the Share Usage Service through the gateway. Run the Share Usage Service on port 3007 and restart it after the contacted-attribution query change.

- Summary cards show the selected day, Monday-start week to date, and calendar month to date.
- Trends show 14 daily buckets, 8 weekly buckets, or 12 monthly buckets ending on the selected date. Missing dates show zero; future dates within the last period are excluded.
- All calendar boundaries use UTC to match SQLite's contacted-date aggregation. The date picker supports historical reporting; Refresh reloads the database totals.
- Only records marked `CONTACTED` with a recorded completion date count. Attribution uses `contactedByEmployeeId`, matching contacted history; allocation/quota counters are separate.

Statistics checks cover employee attribution, date filters, zero activity, Monday/week-year boundaries, leap days, and monthly aggregation. These checks and the production build do not replace live browser verification.

## Admin accounts and password changes

- `/admin`: admin-only account creation, account search, and password resets for other users.
- `/account`: change your own password by entering the current password. All sessions for that account are revoked after a password change/reset.
- Accounts may be Employee or Administrator. Passwords must be 12–128 characters and are stored as salted scrypt hashes. Password hashes are excluded from account API responses.
- Existing employee records are preserved. Accounts without a password must receive an admin reset before they can log in. The old hardcoded credential check has been removed.

### First administrator

In the terminal where you start the User Service, configure these environment variables before starting it:

```bash
export INITIAL_ADMIN_EMAIL='your-admin@example.com'
read -r -s -p 'Initial admin password (12–128 characters): ' INITIAL_ADMIN_PASSWORD
export INITIAL_ADMIN_PASSWORD
npm run start:dev -- user-service
```

Run this from `contact-hub-server`. Use your chosen email and password to sign in, then open `/admin`. These variables are read from the process environment; this service does not automatically load a `.env` file. Optionally set `INITIAL_ADMIN_PHONE` to a unique phone value.

Only when no ADMIN account exists, startup creates the configured admin or upgrades the existing account matching that email, preserving its employee ID. Later restarts do not reset its password. After bootstrap, remove the initial-password variable from your terminal/configuration. Restart the User Service after the account-schema change; the existing local TypeORM synchronization adds the nullable password column and sessions table.

The gateway already forwards `/api/users/*`, including Authorization headers. Account endpoints enforce authentication inside the User Service, even if called directly. Other microservices still use the original PoC employee-ID contract; this change does not claim to add system-wide authorization. Use HTTPS when deploying credential-bearing requests outside local development.

For verification, account tests cover hashing, login, duplicate accounts, admin access checks, password resets, self-service changes, expired/revoked sessions, and initial-admin bootstrap. Repository-wide tests remain affected by stale TypeScript project references; focused tests were run with an isolated config.
