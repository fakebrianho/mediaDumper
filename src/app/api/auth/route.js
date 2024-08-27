import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function GET(req) {
	const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
		process.env
	const oAuth2Client = new google.auth.OAuth2(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URI
	)
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/drive.file'],
	})
	return NextResponse.redirect(authUrl)
}

export async function POST(req) {
	const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
		process.env
	const { code } = await req.json()

	const oAuth2Client = new google.auth.OAuth2(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URI
	)

	const { tokens } = await oAuth2Client.getToken(code)
	oAuth2Client.setCredentials(tokens)

	return NextResponse.json(tokens)
}
