import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export const authenticateGoogle = () => {
	// const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
	// const privateKey = process.env.GOOGLE_PRIVATE_KEY
	// 	? process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n')
	// 	: undefined
	const privateKey = process.env.GOOGLE_PRIVATE_KEY.split(
		String.raw`\n`
	).join('\n')
	const clientEmail = process.env.GOOGLE_CLIENT_EMAIL

	console.log('Private Key Loaded:', !!privateKey)
	console.log('Client Email:', clientEmail)

	const auth = new google.auth.GoogleAuth({
		credentials: {
			type: 'service_account',
			private_key: privateKey,
			client_email: clientEmail,
			// Adding these might help with some API requirements
			project_id: process.env.GOOGLE_PROJECT_ID,
			private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
		},
		scopes: ['https://www.googleapis.com/auth/drive'],
	})
	return auth
}

const uploadFolderToDrive = async (parentFolderId, folderName) => {
	try {
		const auth = authenticateGoogle()
		const drive = google.drive({ version: 'v3', auth })

		console.log('Creating folder:', {
			name: folderName,
			parentFolder: parentFolderId,
			sharedDrive: process.env.GOOGLE_DRIVE_ID,
		})

		const folder = await drive.files.create({
			requestBody: {
				name: folderName,
				mimeType: 'application/vnd.google-apps.folder',
				parents: [parentFolderId], // Parent folder ID
			},
			fields: 'id, name, mimeType',
			supportsAllDrives: true, // Required for shared drives
			supportsTeamDrives: true, // Legacy support
		})

		console.log('Folder created:', folder.data)

		return {
			folder: folder.data,
		}
	} catch (error) {
		console.error('Folder creation error:', {
			message: error.message,
			details: error.errors,
		})
		throw error
	}
}

export async function POST(req) {
	try {
		const res = await req.json()
		const { folderName } = res

		// Use the shared drive folder ID as the parent
		const parentFolderId = process.env.GOOGLE_FOLDER_ID // Your shared drive folder ID
		console.log('parent', process.env.NEXT_PUBLIC_SHARED_DRIVE_ID)
		console.log('parent2', process.env.GOOGLE_PROJECT_ID)
		if (!parentFolderId) {
			throw new Error('Parent folder ID not configured')
		}

		const { folder } = await uploadFolderToDrive(parentFolderId, folderName)

		return NextResponse.json({ folder }, { status: 200 })
	} catch (error) {
		console.error('API error:', error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}
