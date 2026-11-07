# Mailgun EU for transactional email

Transactional email (OTP, verification, group and friend invitations, notifications) goes through
Mailgun EU over its HTTPS API, called from server-side code only. Suggested sender domain
`mg.nextbite.kevinkraemer.com` with sender `login@mg.nextbite.kevinkraemer.com`; both are proposals
until DNS and Mailgun setup confirm them. Delivery sits behind a small provider interface in
`src/core` so Better Auth OTP callbacks and invite flows share one seam.

**Considered Options**

- **Client-side send**: Rejected. API credentials stay in server secrets.
- **Mailgun SDK dependency**: Rejected for now. Plain HTTPS calls keep the surface small; adopt the
  SDK only if retry, batch, or webhook needs justify it.
- **Non-EU region**: Rejected by default for EU data-processing posture; verify terms before
  production.

**Consequences**

- No email credentials in client bundles; server functions own the send path.
- Verify free-tier limits and EU processing terms before launch.
- Invitation emails carry signed tokens validated by the acceptance mutation.
