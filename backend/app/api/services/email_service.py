import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import logging

logger = logging.getLogger(__name__)

SMTP_EMAIL = "realign.chirohouse@gmail.com"
SMTP_PASSWORD = "guez hsdx kxvs cvxa"
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587


def _send_email(to: str, subject: str, html: str) -> bool:
    """Core send function — returns True on success."""
    try:
        msg = MIMEMultipart("alternative")
        msg["From"]    = f"The Chiro House <{SMTP_EMAIL}>"
        msg["To"]      = to
        msg["Subject"] = subject
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to, msg.as_string())

        logger.info(f"[EMAIL] Sent '{subject}' to {to}")
        return True

    except Exception as e:
        logger.error(f"[EMAIL] Failed to send to {to}: {e}")
        return False


# ── Templates ──────────────────────────────────────────────────────────────

def _base(content: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#2c2e25;padding:24px 32px">
        <h2 style="color:#fff;margin:0;font-size:20px;letter-spacing:-0.5px">The Chiro House</h2>
        <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:12px;letter-spacing:1px">REALIGN CLINIC MANAGEMENT</p>
      </div>
      <div style="padding:32px">
        {content}
      </div>
      <div style="background:#f7f7f5;padding:16px 32px;border-top:1px solid #e0e0e0">
        <p style="color:#999;font-size:12px;margin:0">
          This is an automated message from The Chiro House. Please do not reply to this email.<br>
          For enquiries call us or visit our clinic.
        </p>
      </div>
    </div>
    """


def _detail_row(label: str, value: str) -> str:
    return f"""
    <tr>
      <td style="padding:8px 16px 8px 0;color:#666;font-size:14px;white-space:nowrap">{label}</td>
      <td style="padding:8px 0;color:#222;font-size:14px;font-weight:600">{value}</td>
    </tr>
    """


# ── Public email functions ─────────────────────────────────────────────────

def send_appointment_requested(
    to: str,
    patient_name: str,
    treatment_name: str,
    date: str,
    time: str,
    appointment_id: str,
) -> bool:
    content = f"""
    <h3 style="color:#2c2e25;margin-top:0">Appointment Request Received</h3>
    <p style="color:#444;font-size:15px">Hi <strong>{patient_name}</strong>,</p>
    <p style="color:#444;font-size:15px">
      We've received your appointment request. Our staff will review it shortly and
      send you a confirmation once it's approved.
    </p>
    <div style="background:#f7f7f5;border-radius:6px;padding:20px;margin:24px 0">
      <table style="width:100%;border-collapse:collapse">
        {_detail_row("Treatment", treatment_name)}
        {_detail_row("Requested Date", date)}
        {_detail_row("Requested Time", time)}
        {_detail_row("Reference ID", appointment_id[:8].upper())}
        {_detail_row("Status", "⏳ Pending Review")}
      </table>
    </div>
    <p style="color:#666;font-size:13px">
      You'll receive another email as soon as your appointment is confirmed or if
      we need to make any changes.
    </p>
    """
    return _send_email(to, "Appointment Request Received — The Chiro House", _base(content))


def send_appointment_confirmed(
    to: str,
    patient_name: str,
    treatment_name: str,
    date: str,
    time: str,
    appointment_id: str,
    therapist_name: Optional[str] = None,
) -> bool:
    therapist_row = _detail_row("Therapist", therapist_name) if therapist_name else ""
    content = f"""
    <h3 style="color:#2c2e25;margin-top:0">Appointment Confirmed ✓</h3>
    <p style="color:#444;font-size:15px">Hi <strong>{patient_name}</strong>,</p>
    <p style="color:#444;font-size:15px">
      Great news! Your appointment has been <strong style="color:#4d7c4f">confirmed</strong>.
      We look forward to seeing you.
    </p>
    <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:6px;padding:20px;margin:24px 0">
      <table style="width:100%;border-collapse:collapse">
        {_detail_row("Treatment", treatment_name)}
        {_detail_row("Date", date)}
        {_detail_row("Time", time)}
        {therapist_row}
        {_detail_row("Reference ID", appointment_id[:8].upper())}
        {_detail_row("Status", "✅ Confirmed")}
      </table>
    </div>
    <p style="color:#666;font-size:13px">
      Please arrive 10 minutes before your scheduled time. If you need to reschedule,
      contact us as early as possible.
    </p>
    """
    return _send_email(to, "Appointment Confirmed — The Chiro House", _base(content))


def send_appointment_rejected(
    to: str,
    patient_name: str,
    treatment_name: str,
    date: str,
    time: str,
    reason: Optional[str] = None,
) -> bool:
    reason_block = f"""
    <div style="background:#fff3e0;border:1px solid #ffe0b2;border-radius:6px;padding:16px;margin:16px 0">
      <p style="margin:0;color:#e65100;font-size:14px"><strong>Reason:</strong> {reason}</p>
    </div>
    """ if reason else ""

    content = f"""
    <h3 style="color:#2c2e25;margin-top:0">Appointment Update</h3>
    <p style="color:#444;font-size:15px">Hi <strong>{patient_name}</strong>,</p>
    <p style="color:#444;font-size:15px">
      Unfortunately, we were unable to confirm your appointment request for
      <strong>{treatment_name}</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
    </p>
    {reason_block}
    <p style="color:#444;font-size:15px">
      We apologise for the inconvenience. Please book a new appointment at a different
      time, or contact us directly for assistance.
    </p>
    <div style="margin-top:24px">
      <a href="http://localhost:3001/patient/appointments"
         style="background:#2c2e25;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">
        Book Again
      </a>
    </div>
    """
    return _send_email(to, "Appointment Update — The Chiro House", _base(content))


def send_otp_email(to: str, name: str, otp: str) -> bool:
    content = f"""
    <h3 style="color:#2c2e25;margin-top:0">Password Reset Request</h3>
    <p style="color:#444;font-size:15px">Hi <strong>{name}</strong>,</p>
    <p style="color:#444;font-size:15px">
      We received a request to reset your password. Use the code below — it expires in <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;margin:32px 0">
      <div style="display:inline-block;background:#2c2e25;color:#fff;font-size:36px;font-weight:800;
        letter-spacing:12px;padding:20px 40px;border-radius:12px;font-family:monospace">
        {otp}
      </div>
    </div>
    <p style="color:#666;font-size:13px;text-align:center">
      If you didn't request this, you can safely ignore this email.<br>
      Your password will not change.
    </p>
    """
    return _send_email(to, "Your Password Reset Code — The Chiro House", _base(content))