import { google } from 'googleapis'
import { NextResponse } from 'next/server'
import formidable from 'formidable-serverless'
import fs from 'fs'

export const config = {
	api: {
		bodyParser: false,
	},
}

export async function POST(req) {
	const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
		process.env

	const oAuth2Client = new google.auth.OAuth2(
		GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET,
		GOOGLE_REDIRECT_URI
	)

	// Load tokens from session or database
	const tokens = {} // replace with actual token retrieval logic
	oAuth2Client.setCredentials(tokens)

	const drive = google.drive({ version: 'v3', auth: oAuth2Client })

	const form = new formidable.IncomingForm()
	const files = await new Promise((resolve, reject) => {
		form.parse(req, (err, fields, files) => {
			if (err) reject(err)
			resolve(files)
		})
	})

	const fileMetadata = {
		name: files.file.name,
	}
	const media = {
		mimeType: files.file.type,
		body: fs.createReadStream(files.file.path),
	}

	try {
		const file = await drive.files.create({
			resource: fileMetadata,
			media: media,
			fields: 'id',
		})
		return NextResponse.json({ fileId: file.data.id })
	} catch (error) {
		return NextResponse.error('Error uploading file')
	}
}
