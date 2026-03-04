import { google } from "googleapis";
import { format } from "date-fns";

interface TripRequestEmailInput {
  tripId: string;
  propertyName: string;
  requesterName: string;
  requesterEmail: string;
  startDate: Date;
  endDate: Date;
  notes?: string | null;
  adminEmails: string[];
  approveToken: string;
  rejectToken: string;
}

function getGmailClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  }

  const impersonateEmail = process.env.GOOGLE_IMPERSONATE_EMAIL;
  if (!impersonateEmail) {
    throw new Error("GOOGLE_IMPERSONATE_EMAIL is not set");
  }

  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
    clientOptions: { subject: impersonateEmail },
  });

  return { gmail: google.gmail({ version: "v1", auth }), fromEmail: impersonateEmail };
}

function buildRawMessage(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
}): string {
  const message = [
    `From: Terra <${params.from}>`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    params.html,
  ].join("\r\n");

  return Buffer.from(message).toString("base64url");
}

function buildEmailHtml(input: TripRequestEmailInput, baseUrl: string): string {
  const dateRange = `${format(input.startDate, "MMM d, yyyy")} – ${format(input.endDate, "MMM d, yyyy")}`;
  const approveUrl = `${baseUrl}/api/trips/${input.tripId}/review?action=approve&token=${input.approveToken}`;
  const rejectUrl = `${baseUrl}/api/trips/${input.tripId}/review?action=reject&token=${input.rejectToken}`;

  const notesRow = input.notes
    ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Notes</td><td style="padding:8px 0;font-size:14px;">${input.notes}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:#1a1a1a;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Terra</span>
            <span style="color:#9ca3af;font-size:14px;margin-left:8px;">Trip Request</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">New Trip Request</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">${input.requesterName} has requested a trip and is awaiting your approval.</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;padding:0 16px;margin-bottom:28px;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Property</td>
                <td style="padding:8px 0;font-size:14px;font-weight:600;">${input.propertyName}</td>
              </tr>
              <tr style="border-top:1px solid #f3f4f6;">
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Dates</td>
                <td style="padding:8px 0;font-size:14px;">${dateRange}</td>
              </tr>
              <tr style="border-top:1px solid #f3f4f6;">
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Requested by</td>
                <td style="padding:8px 0;font-size:14px;">${input.requesterName}<br><span style="color:#6b7280;">${input.requesterEmail}</span></td>
              </tr>
              ${notesRow ? `<tr style="border-top:1px solid #f3f4f6;">${notesRow.replace("<tr>", "").replace("</tr>", "")}</tr>` : ""}
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:8px;">
                  <a href="${approveUrl}" style="display:block;text-align:center;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:6px;font-size:15px;font-weight:600;">Approve</a>
                </td>
                <td style="padding-left:8px;">
                  <a href="${rejectUrl}" style="display:block;text-align:center;background:#dc2626;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:6px;font-size:15px;font-weight:600;">Reject</a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;">These links expire in 7 days. Clicking them will immediately update the trip status.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendTripRequestEmail(
  input: TripRequestEmailInput
): Promise<void> {
  const { gmail, fromEmail } = getGmailClient();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const html = buildEmailHtml(input, baseUrl);

  const subject = `Trip Request: ${input.propertyName}`;

  await Promise.all(
    input.adminEmails.map((to) => {
      const raw = buildRawMessage({ from: fromEmail, to, subject, html });
      return gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    })
  );
}
