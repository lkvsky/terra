import { google } from "googleapis";
import { format } from "date-fns";

interface CalendarEventInput {
  tripId: string;
  propertyName: string;
  guestNames: string[];
  startDate: Date;
  endDate: Date;
  notes?: string | null;
}

function getCalendarClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  }

  const credentials = JSON.parse(serviceAccountJson);
  const impersonateEmail = process.env.GOOGLE_IMPERSONATE_EMAIL;

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    ...(impersonateEmail && { clientOptions: { subject: impersonateEmail } }),
  });

  return google.calendar({ version: "v3", auth });
}

export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<string> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID is not set");
  }

  const guestList =
    input.guestNames.length > 0 ? input.guestNames.join(", ") : "TBD";
  const summary = `${input.propertyName} — ${guestList}`;

  const description = [
    `Trip ID: ${input.tripId}`,
    input.notes ? `Notes: ${input.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  console.log("[calendar] inserting event to calendarId:", calendarId);

  // Verify the service account can access the calendar
  try {
    const cal = await calendar.calendars.get({ calendarId });
    console.log("[calendar] found calendar:", cal.data.summary);
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    console.error("[calendar] cannot access calendar — code:", e.code, "message:", e.message);
    throw new Error(`Service account cannot access calendar (${e.code}): ${e.message}`);
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: {
        date: format(input.startDate, "yyyy-MM-dd"),
      },
      end: {
        // Google Calendar end date is exclusive, so add 1 day
        date: format(
          new Date(input.endDate.getTime() + 24 * 60 * 60 * 1000),
          "yyyy-MM-dd"
        ),
      },
    },
  });

  const eventId = response.data.id;
  if (!eventId) {
    throw new Error("Calendar event created but no ID returned");
  }

  return eventId;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID is not set");
  }

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}
