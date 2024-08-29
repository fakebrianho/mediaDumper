import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY
const privateKey = process.env.PRIVATE_KEY
const clientEmail = process.env.CLIENT_EMAIL
// const serviceAccountClientId = process.env.NEXT_PUBLIC_SERVICE_ACCOUNT_CLIENT_ID
const serviceAccountClientId = process.env.CLIENT_ID

export const authenticateGoogle = () => {
	const auth = new google.auth.GoogleAuth({
		credentials: {
			private_key: privateKey,
			client_email: clientEmail,
			client_id: serviceAccountClientId,
		},
		scopes: ['https://www.googleapis.com/auth/drive'],
	})
	return auth
}

const uploadFolderToDrive = async (folderId, folderName) => {
	const auth = authenticateGoogle()
	const drive = google.drive({ version: 'v3', auth })
	const folder = await drive.files.create({
		requestBody: {
			name: folderName,
			mimeType: 'application/vnd.google-apps.folder',
			parents: [folderId],
			driveId: folderId,
		},
		supportsAllDrives: true,
	})
	return {
		folder: folder,
	}
}

export async function POST(req) {
	const res = await req.json()
	const { folderId, folderName } = res
	const { folder } = await uploadFolderToDrive(folderId, folderName)
	return NextResponse.json({ folder }, { status: 200 })
}
const sharedDriveId = process.env.NEXT_PUBLIC_SHARED_DRIVE_ID
