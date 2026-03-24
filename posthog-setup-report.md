<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Mylora credit management system (Django/DRF backend). Here is a summary of all changes made:

- **`backend/requirements.txt`** — Added `posthog` as a dependency.
- **`backend/config/settings.py`** — Added `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` settings from environment variables; added `posthog.integrations.django.PosthogContextMiddleware` to `MIDDLEWARE` for automatic request context and exception capture.
- **`backend/accounts/apps.py`** — Extended `AccountsConfig.ready()` to initialize PostHog with the project token, host, and `enable_exception_autocapture = True`.
- **`backend/.env`** — Populated `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` environment variables.
- **`backend/accounts/views.py`** — Added PostHog imports and event tracking for login, logout, password change, and all three credit increase request outcomes.
- **`backend/applications/views.py`** — Added PostHog imports and event tracking for credit application submission, enrollment approval/rejection, and account activation.
- **`backend/payments/views.py`** — Added PostHog imports and event tracking for payment submission, verification, and rejection.
- **`backend/orders/views.py`** — Added PostHog imports and event tracking for order creation.

All events use the `new_context()` / `identify_context()` / `capture()` context API pattern. No PII is included in event properties.

| Event | Description | File |
|---|---|---|
| `user_logged_in` | User successfully logs in | `backend/accounts/views.py` |
| `user_logged_out` | User logs out | `backend/accounts/views.py` |
| `password_changed` | User changes their password | `backend/accounts/views.py` |
| `credit_increase_requested` | Customer submits a credit limit increase request | `backend/accounts/views.py` |
| `credit_increase_approved` | Upper management approves a credit increase request | `backend/accounts/views.py` |
| `credit_increase_rejected` | Upper management rejects a credit increase request | `backend/accounts/views.py` |
| `credit_application_submitted` | New credit enrollment application submitted | `backend/applications/views.py` |
| `enrollment_approved` | Credit manager approves an enrollment application | `backend/applications/views.py` |
| `enrollment_rejected` | Credit manager rejects an enrollment application | `backend/applications/views.py` |
| `account_activated` | Customer activates their account via email link | `backend/applications/views.py` |
| `payment_submitted` | Customer submits a payment request | `backend/payments/views.py` |
| `payment_verified` | Credit manager verifies/approves a payment | `backend/payments/views.py` |
| `payment_rejected` | Credit manager rejects a payment request | `backend/payments/views.py` |
| `order_created` | Customer creates a new purchase order | `backend/orders/views.py` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard:** [Analytics basics](https://us.posthog.com/project/353144/dashboard/1392163)
- [Credit Application to Account Activation Funnel](https://us.posthog.com/project/353144/insights/u9JSaFTL) — end-to-end onboarding conversion
- [Daily Active Users (Logins)](https://us.posthog.com/project/353144/insights/CjnW4eTm) — daily engagement over the last 30 days
- [Payment Verification Funnel](https://us.posthog.com/project/353144/insights/6Au2CItD) — payment submission to verification rate
- [Credit Increase Request Outcomes](https://us.posthog.com/project/353144/insights/cmKEUr0f) — weekly approved vs rejected credit increase requests
- [Orders Created vs Enrollment Approvals](https://us.posthog.com/project/353144/insights/99PCEmxw) — weekly business growth signals

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
