# Connecting the portal to Zoho One

The portal talks to Zoho with **one service account**. An administrator connects it once through
OAuth; after that every employee's access is decided by the portal's own roles and permissions.
Employees never see a Zoho login.

Budget about 30 minutes the first time. Everything below is done once.

## 1. Create the Zoho One trial

1. Go to <https://www.zoho.com/one/> and start the free trial. Use an email you control; Zoho sends a
   verification link.
2. Pick the data centre carefully. Accounts created from India land on **zoho.in**; the US is
   **zoho.com**; Europe is **zoho.eu**. The portal's `ZOHO_REGION` must match. If you are not sure,
   look at the address bar after signing in: `one.zoho.in` means `in`.
3. In the Zoho One admin panel, add these applications to the organisation:
   **CRM, People, Desk, Books**. Open each one once and complete its first-run wizard so that an
   organisation exists (Desk and Books refuse API calls until their org is created).
4. Add a little sample data so the portal tables are not empty: two leads in CRM, two employees in
   People, two tickets in Desk, two invoices in Books. Sample data in the trial is fine.

## 2. Register an API client

1. Open the API console for your data centre:
   - India: <https://api-console.zoho.in>
   - US: <https://api-console.zoho.com>
   - EU: <https://api-console.zoho.eu>
2. Click **Add Client** and choose **Server-based Applications**.
3. Fill in:
   - Client Name: `Brainwave Portal`
   - Homepage URL: `http://localhost:3000`
   - Authorized Redirect URIs: `http://localhost:4000/api/zoho/oauth/callback`
4. Click **Create**. Copy the **Client ID** and **Client Secret**.

The redirect URI must match `${API_URL}/api/zoho/oauth/callback` exactly. When you deploy, add the
production URL as a second redirect URI in the same client.

## 3. Configure the API

Edit `apps/api/.env`:

```env
ZOHO_REGION=in
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_MOCK=false
```

Leave `ZOHO_DESK_ORG_ID` and `ZOHO_BOOKS_ORG_ID` empty; the API discovers the first organisation on
the account. Set them only if the account has several organisations.

Restart the API (`pnpm dev` restarts automatically in watch mode; otherwise stop and start it).

## 4. Connect from the portal

1. Sign in as an admin (`admin@brainwave.dev`).
2. Open **Administration → Integrations** and click **Connect Zoho**.
3. You are sent to Zoho's consent page. Sign in with the account that owns the Zoho One
   organisation (the super admin) and click **Accept**.
4. Zoho redirects back to the portal. The Integrations page shows **Connected**, the API domain,
   the scopes granted and who connected it.

Behind the scenes the API exchanged the authorization code for a refresh token, encrypted it with
`TOKEN_ENCRYPTION_KEY` and stored it in the `zoho_connections` table. Access tokens are refreshed on
demand and never leave the server.

## 5. Check each application

Sign in as each demo user and open the service page:

| User                   | Page                | Zoho call                                              |
| ---------------------- | ------------------- | ------------------------------------------------------ |
| sales@brainwave.dev    | Zoho CRM → Leads    | `GET {api_domain}/crm/v7/Leads`                        |
| hr@brainwave.dev       | Zoho People → Employees | `GET https://people.zoho.{region}/people/api/forms/employee/getRecords` |
| support@brainwave.dev  | Zoho Desk → Tickets | `GET https://desk.zoho.{region}/api/v1/tickets` with `orgId` header |
| finance@brainwave.dev  | Zoho Books → Invoices | `GET {api_domain}/books/v3/invoices?organization_id=…` |

**Open in Zoho** on each card sends the user to the matching Zoho web app in a new tab. The Zoho
web app has its own login; in a real deployment that would be handled by SSO (SAML) from the
company identity provider, which is outside the scope of this portal.

## Scopes requested

All read-only, which is the least privilege the portal needs.

| Scope                              | Used for                              |
| ---------------------------------- | ------------------------------------- |
| `ZohoCRM.modules.leads.READ`       | Leads list                            |
| `ZohoCRM.settings.modules.READ`    | Module metadata                       |
| `ZOHOPEOPLE.forms.READ`            | Employee form records                 |
| `Desk.tickets.READ`                | Tickets list                          |
| `Desk.basic.READ`                  | Organisation lookup                   |
| `Desk.settings.READ`               | Organisation details                  |
| `ZohoBooks.invoices.READ`          | Invoices list                         |
| `ZohoBooks.settings.READ`          | Organisation lookup                   |

To add a scope, edit `ZOHO_SCOPES` in `apps/api/src/modules/zoho/zoho.catalog.ts` and reconnect
from the Integrations page (the consent screen is shown again with `prompt=consent`).

## Troubleshooting

| Symptom                                                        | Cause and fix                                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Consent page says **Invalid Redirect Uri**                     | The URI in the API console does not match `${API_URL}/api/zoho/oauth/callback` character for character.         |
| Consent page says **Invalid OAuth Scope**                      | A scope name is wrong for that application. Compare with the table above and Zoho's scope docs.                 |
| Redirected back with `status=error&reason=invalid_state`       | The connect flow took longer than 10 minutes or the API restarted mid-flow. Click Connect again.                 |
| Redirected back with `reason=…did not return a refresh token`  | The client is not Server-based, or consent was skipped. Recreate the client as Server-based and reconnect.       |
| Integrations shows connected but a service page shows 502      | The Zoho app is not enabled for the account or has no organisation. Open the app in Zoho One once.               |
| Books or Desk: "No … organization found"                       | Set `ZOHO_BOOKS_ORG_ID` / `ZOHO_DESK_ORG_ID` explicitly. Books: Settings → Organization Profile. Desk: Setup → General → Company. |
| Everything works then fails after some time                    | The refresh token was revoked in Zoho (Accounts → Security → Connected apps). Reconnect.                          |
| Data centre mismatch (`accounts.zoho.com` in the error)        | Set `ZOHO_REGION` to the account's region and recreate the client in that region's API console.                  |

## Disconnecting

**Administration → Integrations → Disconnect** deletes the stored tokens. Also revoke the app under
the Zoho account's Security → Connected Apps if the credentials should be retired for good.
