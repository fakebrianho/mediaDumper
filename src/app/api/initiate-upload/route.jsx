// app/api/initiate-upload/route.js
import { google } from 'googleapis'

const serviceAccount = {
	type: 'service_account',
	project_id: process.env.GOOGLE_PROJECT_ID,
	private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
	private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
	client_email: process.env.GOOGLE_CLIENT_EMAIL,
	client_id: process.env.GOOGLE_CLIENT_ID,
	auth_uri: 'https://accounts.google.com/o/oauth2/auth',
	token_uri: 'https://oauth2.googleapis.com/token',
	auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
	client_x509_cert_url: process.env.GOOGLE_CERT_URL,
}

const auth = new google.auth.GoogleAuth({
	credentials: serviceAccount,
	scopes: ['https://www.googleapis.com/auth/drive'],
})

const drive = google.drive({ version: 'v3', auth })

export async function POST(request) {
	try {
		// const folderId = process.env.GOOGLE_FOLDER_ID
		// let folderId
		// if (!folderId) {
		// throw new Error('GOOGLE_FOLDER_ID is not set')
		// }

		const { filename, mimeType, fileSize, folderId } = await request.json()
		console.log('Starting upload process for:', {
			filename,
			mimeType,
			fileSize,
			folderId,
		})

		// Get auth client for direct API calls
		const authClient = await auth.getClient()
		const accessToken = await authClient.getAccessToken()

		// Create resumable upload session
		const sessionResponse = await fetch(
			'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken.token}`,
					'Content-Type': 'application/json; charset=UTF-8',
					'X-Upload-Content-Type': mimeType,
					'X-Upload-Content-Length': String(fileSize),
				},
				body: JSON.stringify({
					name: filename,
					parents: [folderId],
				}),
			}
		)

		console.log('Session creation status:', sessionResponse.status)
		console.log(
			'Session headers:',
			Object.fromEntries(sessionResponse.headers.entries())
		)

		if (!sessionResponse.ok) {
			const errorText = await sessionResponse.text()
			throw new Error(
				`Failed to create upload session: ${sessionResponse.status} - ${errorText}`
			)
		}

		const uploadUrl = sessionResponse.headers.get('location')
		if (!uploadUrl) {
			throw new Error('No upload URL received from Google Drive API')
		}

		console.log('Successfully created upload session. URL received.')

		return new Response(
			JSON.stringify({
				uploadUrl,
				sessionData: {
					filename,
					mimeType,
					totalSize: fileSize,
					uploadedBytes: 0,
				},
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
	} catch (error) {
		console.error('Upload session creation failed:', {
			message: error.message,
			name: error.name,
			stack: error.stack,
			response: error.response?.data,
		})

		return new Response(
			JSON.stringify({
				message: 'Failed to initiate upload session',
				error: error.message,
				details: error.response?.data || error.stack,
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
	}
}
