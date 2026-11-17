# Contact Hub

Contact Hub is a local system-design PoC for uploading Excel contact lists, processing them in the background, allocating contacts for outreach, and tracking completed outreach.

The application includes a Next.js frontend, a NestJS API gateway and services, SQLite databases, and a BullMQ worker backed by Redis.

## Project structure

```text
contact-hub/
├── web-app/                 # Next.js frontend
├── contact-hub-server/      # NestJS services and background worker
│   ├── apps/
│   ├── data/                # Local SQLite databases (created at runtime)
│   └── storage/             # Uploaded spreadsheets
└── README.md
```

Browser requests follow this path:

```text
Browser → Next.js /api proxy → API Gateway → Backend services
                                             |
                                     Upload → Redis → ETL → Contacts database
```

## Prerequisites

- Node.js and npm compatible with the installed Next.js 16 and NestJS 12 dependencies. Development in this workspace uses Node.js 26.
- Redis reachable at `127.0.0.1:6379`. The queue connection is currently configured directly in the Upload and ETL modules.
- Docker if you choose the Redis container option below.
- A terminal for each application process.

Run the commands below from the repository root unless another directory is specified.

## 1. Install dependencies

Install the backend dependencies:

```bash
cd contact-hub-server
npm ci
mkdir -p data storage
```

In another terminal, install the frontend dependencies:

```bash
cd web-app
npm ci
cp .env.example .env.local
```

The frontend environment file should contain:

```dotenv
API_GATEWAY_URL=http://127.0.0.1:3000
```

This is the gateway origin, without `/api`. Restart Next.js after changing it. The browser uses the frontend's own `/api` address, so it does not need to know individual service ports.

## 2. Start Redis

If Redis is already running locally, use that instance. Otherwise, create a local container:

```bash
docker run --name contact-hub-redis -p 127.0.0.1:6379:6379 -d redis:7
```

On subsequent starts, reuse it:

```bash
docker start contact-hub-redis
```

Check that it responds:

```bash
docker exec contact-hub-redis redis-cli ping
```

Expected response: `PONG`.

## 3. Start the backend services

Run **each command in a separate terminal**, with the working directory set to `contact-hub-server`. Paths to databases and uploaded files are relative to this directory.

Start the Contact and Upload services first and wait for their startup messages before starting the ETL worker and Share Usage Service. Their startup initializes the database tables the other processes use.

| Process | Command | Default port |
| --- | --- | --- |
| Contact Service | `npx nest start contact-service --watch` | 3005 |
| Upload Service | `npx nest start upload-service --watch` | 3003 |
| ETL worker | `npx nest start etl-service --watch` | No HTTP listener |
| Share Usage Service | `npx nest start share-usage-service --watch` | 3007 |
| User Service | See first-admin setup below | 3002 |
| API Gateway | `npx nest start api-gateway --watch` | 3000 |

The Sharing Service is optional for the current frontend flow. Start it with `npx nest start sharing-service --watch` if testing `/api/shares/*`; it uses port 3006. The current frontend allocates directly through `/api/contacts/claim`. The Upload Usage Service is not required for the implemented screens.

Do not export a shared `PORT` value across services: the gateway and Contact Service both read `PORT`, with different defaults. User, Upload, and Share Usage services use `USER_SERVICE_PORT`, `UPLOAD_SERVICE_PORT`, and `SHARE_USAGE_SERVICE_PORT`, respectively. Gateway target ports are currently hardcoded, so changing service ports also requires updating its targets.

### First-admin setup

Before starting the User Service for the first time, configure the initial admin in **that service's terminal**:

```bash
export INITIAL_ADMIN_EMAIL='your-admin@example.com'
read -r -s -p 'Enter admin password (12–128 characters), then press Enter: ' INITIAL_ADMIN_PASSWORD
echo
export INITIAL_ADMIN_PASSWORD
npx nest start user-service --watch
```

The quoted text after `-p` is a prompt, not the password. Type your actual password when prompted; the terminal will hide it. Passwords shorter than 12 or longer than 128 characters prevent initial-admin startup.

The User Service reads these values from its process environment; it does not automatically load a backend `.env` file. Optionally set `INITIAL_ADMIN_PHONE` to a unique phone value before starting.

When no admin exists, startup creates one or upgrades the existing employee with the same email, preserving that employee ID. **Once an admin exists, these variables do not reset its password.** The former hardcoded login credentials are no longer used.

For later starts, run:

```bash
npx nest start user-service --watch
```

Remove `INITIAL_ADMIN_PASSWORD` from your shell/configuration after initial setup. To remove it from the current shell after stopping the service, run `unset INITIAL_ADMIN_PASSWORD`.

## 4. Start the frontend

From `web-app`:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Open **http://localhost:3001/login**. The frontend uses port **3001**, while the gateway uses **3000**.

For phone testing on the same Wi-Fi network, open `http://<computer-LAN-IP>:3001`. Allow port 3001 through your local firewall if needed. Browser API requests go through Next.js, so the phone does not need to access each backend port.

## 5. Use the application

### Sign in and create accounts

1. Sign in with the admin email and password used during bootstrap.
2. Open **Admin** (`/admin`).
3. Enter the employee's name, email, unique phone number, initial password, and role.
4. Create the account and share its initial password securely.
5. The employee can sign in using those credentials and change their password under **Account** (`/account`).

Admins can reset other users' passwords from the account list. Changing your own password requires the current password. Password changes and resets invalidate all sessions for the affected account. Existing employee records without a password need an admin password reset before they can sign in.

### Upload an Excel spreadsheet

1. Open **Upload** (`/upload`).
2. Select one `.xlsx` spreadsheet, up to 50 MiB.
3. Include these headers in the worksheet's first row:

   | Name | Email | Phone | Interest |
   | --- | --- | --- | --- |
   | Sample Person | sample@example.com | 9876543210 | Technology |

4. Click **Upload file**.
5. Watch the processing status and final row counts. File acceptance means it was submitted for background processing; it does not mean import has finished.

The worker expects the headers Name, Email, Phone, and Interest. Rows must have a name and valid email. Status polling stops at `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`, or `QUEUE_FAILED`.

### Allocate and contact people

1. Wait for the upload to finish processing.
2. Open **Contacts** (`/contacts`).
3. Choose between 1 and 2,000 contacts, within the remaining daily allowance.
4. Click **Fetch contacts**.
5. Search or paginate the returned allocation while doing outreach.
6. After completing outreach for the batch, click **Mark this allocation as contacted**. This marks the whole allocation, not individual selected rows.

The current backend allocates from contacts belonging to the requesting employee. Upload under the same employee account you will use to fetch contacts. Allocations expire after 15 minutes; expired contacts can become available again.

### View history and statistics

| Page | Purpose |
| --- | --- |
| `/contacts/contacted` | Search completed outreach across previous allocations; includes contacted timestamps |
| `/contacts/stats` | Selected-day, week-to-date, and month-to-date totals with daily, weekly, and monthly trends |
| `/account` | Change your own password |
| `/admin` | Admin-only account creation and password resets |

Statistics count records marked `CONTACTED`, attributed to the employee who completed the outreach. Calendar calculations use UTC, weeks start on Monday, and the selected date ends the reporting period. Use Refresh after completing a batch to reload totals.

## Current limits and implementation details

- The backend currently enforces **2,000 contacts per day**, as well as 2,000 per allocation. The proposed 20,000 daily limit is not yet implemented.
- Allocating consumes the daily allowance; marking contacts as contacted records completed outreach separately.
- Session tokens expire after eight hours. Passwords are stored as salted scrypt hashes; account-management endpoints enforce backend session and role checks.
- Other services still use the original PoC employee-ID contract. System-wide authorization has not yet been implemented.
- Claims are temporary reservations, not permanent global allocation. Backend request-ID idempotency and claim recovery are not implemented.
- Local SQLite schema synchronization is enabled for several services. Preserve `contact-hub-server/data` and `storage` between runs; deleting them removes application data.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Login rejects the old admin password | Hardcoded login was removed. Use the stored account password; bootstrap environment changes do not update existing accounts. |
| Startup says password must contain 12–128 characters | Re-enter the password using the hidden-input command, then restart the User Service. |
| Login or API calls cannot reach the server | Start the gateway and relevant service; check `API_GATEWAY_URL`, and ensure Next.js is on 3001 rather than 3000. |
| Address already in use | Check for another process on the port and for a shared `PORT` environment variable. |
| Upload remains pending | Verify Redis and the ETL worker are running. |
| Upload processing fails | Check worksheet headers, input rows, and worker logs. Start Upload Service before the ETL worker on a fresh database. |
| No contacts returned | Ensure processing completed and the contacts were uploaded by the employee currently requesting them. Previously reserved/contacted records affect availability. |
| Daily allowance exhausted | The current backend limit is 2,000, resetting by UTC quota date. |
| History or stats fails | Start Contact Service and Share Usage Service; restart them after endpoint/query changes. |
| Admin page denies access | Sign in with a stored ADMIN account. Editing browser role values does not grant backend access. |

### Unconfirmed allocation message

If an allocation request loses its response, the frontend persists an uncertainty lock to prevent a retry from allocating another batch. Refreshing preserves this lock in the same tab.

Before unlocking local testing, inspect the failed `/api/contacts/claim` request in browser DevTools and confirm in the backend whether it committed. After accounting for that allocation, remove `contact-hub.claim.<employeeId>` from **Application → Session Storage** and refresh. Removing this entry does not undo allocations or restore quota. Do not use this as a substitute for backend recovery.

## Checks and shutdown

Frontend checks, from `web-app`:

```bash
npx tsc --noEmit
npm run build
```

The backend's usual test command is `npm test`, run from `contact-hub-server`. The current repository has stale TypeScript project references that can prevent the standard test runner from starting. Focused feature tests have been verified using an isolated configuration; resolve those project references before relying on the full test command.

Stop each application process with **Ctrl+C**. To stop the optional Redis container without removing its container state:

```bash
docker stop contact-hub-redis
```

For frontend-specific details, see [web-app/README.md](web-app/README.md).
