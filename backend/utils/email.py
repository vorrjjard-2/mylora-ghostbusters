import resend
from django.conf import settings


def send_email(to, subject, message):
    """Send email via Resend API. Falls back to printing if no API key."""
    api_key = settings.RESEND_API_KEY
    from_email = settings.DEFAULT_FROM_EMAIL

    if not api_key:
        print(f"[EMAIL] No RESEND_API_KEY set. Would send to {to}:")
        print(f"  Subject: {subject}")
        print(f"  Body: {message[:200]}...")
        return True

    resend.api_key = api_key
    params = {
        "from": from_email,
        "to": [to] if isinstance(to, str) else to,
        "subject": subject,
        "text": message,
    }
    result = resend.Emails.send(params)
    return result
