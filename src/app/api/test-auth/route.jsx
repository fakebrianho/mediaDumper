import { google } from 'googleapis'

export async function GET() {
	try {
		const auth = new google.auth.GoogleAuth({
			credentials: {
				type: 'service_account',
				project_id: process.env.GOOGLE_PROJECT_ID,
				private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
				private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(
					/\\n/g,
					'\n'
				),
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

		// Get specific folder info
		const folderId = process.env.GOOGLE_FOLDER_ID // Use folder ID instead of drive ID
		const folder = await drive.files.get({
			fileId: folderId,
			supportsAllDrives: true,
		})

		// List files in the specific folder
		const files = await drive.files.list({
			q: `'${folderId}' in parents`,
			supportsAllDrives: true,
			includeItemsFromAllDrives: true,
			fields: 'files(id, name, mimeType, createdTime)',
		})

		return new Response(
			JSON.stringify({
				success: true,
				folder: folder.data,
				files: files.data.files,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	} catch (error) {
		console.error('Full error:', error)
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message,
				errors: error.errors,
				status: error.code,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	}
}