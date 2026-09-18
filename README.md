# Web Base

## Environment variables

Set `MONGODB_URI` to a MongoDB connection string before starting the server:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/web-base-io
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
SESSION_SECRET=replace-with-at-least-32-random-characters
```

The server connects to MongoDB before it starts listening.

## Email verification

Email is currently disabled unless the `email` value is present in the system
collection's `features` array. Admins can toggle it from the whitelabel settings
page. While disabled, registration does not queue email, pending jobs skip
delivery, and login and sessions do not require verification. Verification
endpoints skip processing, and registration shows an account-created message.
SMTP configuration is not required. Accounts retain their actual verification
status.

Registration sends a welcome email using the English or Brazilian Portuguese template.
The confirmation email uses a single-use link valid for 24 hours. Login requires
email verification; unverified users see an error asking them to verify their email. Root and admin
seed accounts and users created through the dashboard are verified automatically.

Set `APP_URL` to the public application origin and `MAIL_FROM` to the sender address.
SMTP uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, and optional `SMTP_USER` and
`SMTP_PASSWORD`. Local defaults are included in `.dev.env`; Mailpit's inbox is at
`http://localhost:8025`. Delivery runs through Agenda jobs; if enqueueing fails,
the account is created but cannot log in until email verification succeeds.

Verification tokens are hashed on the user record, bound to the email address,
and consumed atomically. A successful resend replaces the previous token.

## Authentication API

- `POST /api/auth/register` with `{ "email": "user@example.com", "fullName": "Example User", "password": "password" }`
- `POST /api/auth/login` with `{ "email": "user@example.com", "password": "password" }`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

Registration and user create/update endpoints accept an optional `phoneNumber`
string (up to 50 characters). Omit it on update to preserve the current number,
or send an empty string to clear it.

## Architecture

- `client/routes/`: page queries, tables, pagination, and page actions.
- `client/components/commons/UserFormDialog.tsx`: user create/edit form and save logic.
- `client/components/commons/RoleFormDialog.tsx`: role create/edit form and save logic.
- `client/components/commons/RolePermissionsDialog.tsx`: permission selection and assignment updates.
- `client/components/guards/`: client permission checks; server middleware enforces access.
- `client/components/elements/`: small UI wrappers. Text defaults to a paragraph; Block, Flex, and Grid default to divs. All accept `as`, forward HTML props, and preserve supplied classes; Flex and Grid add their respective display class. Inspect other wrappers when their behavior matters.
- `server/server.ts`: Express startup, API mounts, and Vite/production SSR.
- `server/routes/`, `server/models/`, `server/middlewares/`: API handlers, MongoDB schemas, and access/session handling.
- `server/gateways/`, `server/jobs/`, `server/templates/`: email delivery and queued verification jobs.
- `types.d.ts`, `enumerators/permission.ts`: shared types and permission names.
- `enumerators/feature.ts`: shared system feature names for client and server.
- `locales/en.json`, `locales/pt.json`: translated UI strings.

## Development and validation

Install dependencies with `npm ci`, configure `.env`, then run `npm run dev`.

- `npm run lint`: check without modifying source; `npm run lint:fix` explicitly applies fixes.
- `npm run typecheck`: check TypeScript without emitting application code.
- `npm run format:check -- <changed-files>`: check formatting on explicit paths.
- `npm run format -- <changed-files>`: format only the specified files.
- `npm run build`: type-check and build client and SSR bundles.

There is currently no automated test suite. For form changes, manually check create/edit, validation errors, cancellation, and permission restrictions with a running backend.

For routine source searches, use `rg -n "pattern" client server locales enumerators types.d.ts`. Read only relevant sections; inspect lockfiles and assets when the task requires them.
