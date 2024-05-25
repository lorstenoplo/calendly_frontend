// pages/api/google-calendar.js
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const calendar = google.calendar("v3");

const handler = async (req: NextRequest, res: NextResponse) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  try {
    const calendarId = "primary";
    const events = await calendar.events.list({
      calendarId,
      auth: oAuth2Client,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });
    //eslint-ignore
    res.status(200).json({ events: events.data.items });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default handler;
