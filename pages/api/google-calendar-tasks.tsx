import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const tasks = google.tasks({ version: "v1", auth: oAuth2Client });

export default async function listTasks(req: NextRequest, res: NextResponse) {
  try {
    const calendar_response = await tasks.tasks.list({
      tasklist: "@default", // '@default' refers to the primary task list
    });

    console.log("Fetched Tasks:", calendar_response.data.items); // Log fetched tasks
    return res.status(200).json(calendar_response.data.items);
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ error: error.message });
  }
}
