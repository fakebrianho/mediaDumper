// app/api/initiate-bulk-upload/route.js
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

let cachedAuthClient = null

async function getAuthClient() {
	if (!cachedAuthClient) {
		cachedAuthClient = await auth.getClient()
	}
	return cachedAuthClient
}

export async function POST(request) {
	try {
		// Expect an array of files
		const { files, folderId } = await request.json()

		// Get single auth token for all files
		const authClient = await getAuthClient()
		const accessToken = await authClient.getAccessToken()

		// Create upload sessions for all files
		const uploadSessions = await Promise.all(
			files.map(async (file) => {
				try {
					const sessionResponse = await fetch(
						'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
						{
							method: 'POST',
							headers: {
								Authorization: `Bearer ${accessToken.token}`,
								'Content-Type':
									'application/json; charset=UTF-8',
								'X-Upload-Content-Type': file.mimeType,
								'X-Upload-Content-Length': String(file.size),
							},
							body: JSON.stringify({
								name: file.name,
								parents: [folderId],
							}),
						}
					)

					if (!sessionResponse.ok) {
						throw new Error(
							`Failed to create session for ${file.name}: ${sessionResponse.status}`
						)
					}

					const uploadUrl = sessionResponse.headers.get('location')
					if (!uploadUrl) {
						throw new Error(
							`No upload URL received for ${file.name}`
						)
					}

					return {
						filename: file.name,
						uploadUrl,
						mimeType: file.mimeType,
						size: file.size,
					}
				} catch (error) {
					console.error(
						`Failed to create session for ${file.name}:`,
						error
					)
					return {
						filename: file.name,
						error: error.message,
					}
				}
			})
		)

		return new Response(
			JSON.stringify({
				sessions: uploadSessions,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
	} catch (error) {
		console.error('Bulk upload session creation failed:', {
			message: error.message,
			stack: error.stack,
		})
		return new Response(
			JSON.stringify({
				message: 'Failed to initiate bulk upload sessions',
				error: error.message,
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
