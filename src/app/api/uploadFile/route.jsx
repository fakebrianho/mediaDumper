import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { authenticateGoogle } from '../createFolder/route'
import mime from 'mime'
import { Readable } from 'stream'

const uploadFileToDrive = async (folderId, driveId, files) => {
	const auth = authenticateGoogle()
	const drive = google.drive({ version: 'v3', auth })
	const uploadFile = async (file) => {
		const mimeType = mime.getType(file.name)
		const fileMetadata = {
			name: file.name,
			parents: [folderId],
			mimeType: mimeType,
			driveId: driveId,
		}
		const fileBuffer = file.stream()
		const response = await drive.files.create({
			requestBody: fileMetadata,
			media: {
				mimeType: mimeType,
				body: Readable.from(fileBuffer),
			},
			fields: 'id',
			supportsAllDrives: true,
		})
		if (!response.data.id) {
			throw new Error('File upload failed, no file ID returned.')
		}
		const fileLink = await drive.files.get({
			fileId: response.data.id,
			fields: 'webViewLink',
			supportsAllDrives: true,
		})
		return fileLink.data
	}
	const fileLinks = await Promise.all(files.map((file) => uploadFile(file)))
	return fileLinks
}

export async function POST(req) {
	const res = await req.formData()
	console.log('res', res)
	const folderId = res.get('folderId')
	const driveId = res.get('driveId')
	// const file = res.get('file')
	// const files = res.get('files')
	const files = []
	for (let i = 0; ; i++) {
		const file = res.get(`files[${i}]`)
		if (!file) break
		files.push(file)
	}

	if (!folderId || !driveId || files.length === 0)
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	const fileLink = await uploadFileToDrive(folderId, driveId, files)
	return NextResponse.json({ fileLink }, { status: 200 })
}
