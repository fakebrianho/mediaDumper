import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export const authenticateGoogle = () => {
	const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
	const clientEmail = process.env.GOOGLE_CLIENT_EMAIL

	// Enhanced environment variable checking
	const envCheck = {
		privateKey: !!privateKey,
		clientEmail: !!clientEmail,
		projectId: !!process.env.GOOGLE_PROJECT_ID,
		privateKeyId: !!process.env.GOOGLE_PRIVATE_KEY_ID,
		folderId: !!process.env.GOOGLE_FOLDER_ID,
	}

	console.log('Environment variables check:', envCheck)

	if (!privateKey || !clientEmail) {
		throw new Error('Missing required Google credentials')
	}

	const auth = new google.auth.GoogleAuth({
		credentials: {
			type: 'service_account',
			private_key: privateKey,
			client_email: clientEmail,
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

		// Log the request parameters
		console.log('Creating folder with params:', {
			folderName,
			parentFolderId,
			env: {
				hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
				hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
				hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
				hasFolderId: !!process.env.GOOGLE_FOLDER_ID,
			},
		})

		const folder = await drive.files.create({
			requestBody: {
				name: folderName,
				mimeType: 'application/vnd.google-apps.folder',
				parents: [parentFolderId],
			},
			fields: 'id, name, mimeType',
			supportsAllDrives: true,
			supportsTeamDrives: true,
		})

		console.log('Folder creation response:', folder.data)
		return { folder: folder.data }
	} catch (error) {
		console.error('Folder creation error:', {
			message: error.message,
			details: error.errors,
			stack: error.stack,
		})
		throw error
	}
}

export async function POST(req) {
	console.log('POST request received to create folder')

	try {
		const res = await req.json()
		console.log('Request body:', res)

		const { folderName } = res
		if (!folderName) {
			throw new Error('Folder name is required')
		}

		const parentFolderId = process.env.GOOGLE_FOLDER_ID
		if (!parentFolderId) {
			throw new Error(
				'GOOGLE_FOLDER_ID not configured in environment variables'
			)
		}

		console.log('Creating folder:', {
			folderName,
			parentFolderId: parentFolderId.substring(0, 8) + '...', // Log partial ID for security
		})

		const { folder } = await uploadFolderToDrive(parentFolderId, folderName)

		return NextResponse.json(
			{
				success: true,
				folder,
				message: 'Folder created successfully',
			},
			{ status: 200 }
		)
	} catch (error) {
		console.error('Folder creation failed:', {
			error: error.message,
			stack: error.stack,
			type: error.constructor.name,
		})

		return NextResponse.json(
			{
				success: false,
				error: error.message,
				details:
					process.env.NODE_ENV === 'development'
						? error.stack
						: undefined,
			},
			{ status: 500 }
		)
	}
}

// Add OPTIONS handler for CORS
export async function OPTIONS(req) {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		},
	})
}
