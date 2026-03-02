/**
 * Run with: npx dotenv -e .env.local -- tsx scripts/test-calendar.ts
 */
import { google } from "googleapis";

async function main() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");

  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID not set");

  const impersonateEmail = process.env.GOOGLE_IMPERSONATE_EMAIL;
  console.log("Impersonating:", impersonateEmail ?? "(none — set GOOGLE_IMPERSONATE_EMAIL)");

  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    ...(impersonateEmail && { clientOptions: { subject: impersonateEmail } }),
  });

  const calendar = google.calendar({ version: "v3", auth });

  // 1. List all calendars the service account can see
  console.log("\n--- Calendars visible to service account ---");
  const list = await calendar.calendarList.list();
  if (!list.data.items?.length) {
    console.log("(none — service account has no calendars in its list)");
  } else {
    for (const cal of list.data.items) {
      console.log(`  ${cal.id} — ${cal.summary} [${cal.accessRole}]`);
    }
  }

  // 2. Try to directly fetch the target calendar
  console.log("\n--- Fetching target calendar by ID ---");
  try {
    const cal = await calendar.calendars.get({ calendarId });
    console.log("  Found:", cal.data.summary);
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    console.error("  Error:", e.code, e.message);
  }

  // 3. Try inserting a test event
  console.log("\n--- Inserting test event ---");
  try {
    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: "Terra test event (delete me)",
        start: { date: "2026-04-01" },
        end: { date: "2026-04-02" },
      },
    });
    console.log("  Success! Event ID:", event.data.id);
    // Clean up
    await calendar.events.delete({ calendarId, eventId: event.data.id! });
    console.log("  Cleaned up test event.");
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    console.error("  Error:", e.code, e.message);
  }
}

main().catch(console.error);
