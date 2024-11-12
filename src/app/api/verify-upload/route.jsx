// app/api/verify-upload/route.js
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
	credentials: {
		type: 'service_account',
		project_id: process.env.GOOGLE_PROJECT_ID,
		private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
		private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
		client_email: process.env.GOOGLE_CLIENT_EMAIL,
		client_id: process.env.GOOGLE_CLIENT_ID,
		auth_uri: 'https://accounts.google.com/o/oauth2/auth',
		token_uri: 'https://oauth2.googleapis.com/token',
		auth_provider_x509_cert_url:
			'https://www.googleapis.com/oauth2/v1/certs',
		client_x509_cert_url: process.env.GOOGLE_CERT_URL,
	},
	scopes: ['https://www.googleapis.com/auth/drive'],
})

const drive = google.drive({ version: 'v3', auth })

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url)
		const filename = searchParams.get('filename')

		if (!filename) {
			throw new Error('Filename is required')
		}

		const response = await drive.files.list({
			q: `name = '${filename}' and '${process.env.GOOGLE_FOLDER_ID}' in parents`,
			fields: 'files(id, name, mimeType, createdTime)',
			supportsAllDrives: true,
			includeItemsFromAllDrives: true,
		})

		const file = response.data.files[0]
		if (!file) {
			throw new Error('File not found')
		}

		return new Response(JSON.stringify(file), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
