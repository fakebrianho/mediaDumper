import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { authenticateGoogle } from '../createFolder/route'
import mime from 'mime'
import { Readable } from 'stream'

const uploadFileToDrive = async (files, folderId, driveId) => {
	const auth = authenticateGoogle()
	const drive = google.drive({ version: 'v3', auth })
	const uploadFile = async (file) => {
		console.log(file, 'file0004')
		console.log('type', typeof file)
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
	const flattenedFiles = files.flat()
	console.log(flattenedFiles)
	const fileLinks = await Promise.all(files.map((file) => uploadFile(file)))
	// const fileLinks = await Promise.all(files.map((file) => uploadFile(file)))
	return fileLinks
}

export async function POST(req) {
	const res = await req.formData()
	const folderId = res.get('folderId')
	const driveId = res.get('driveId')
	const files = res.getAll('files')
	console.log('files here', files[0])
	console.log(typeof files[0])
	if (!folderId || !driveId || files.length === 0)
		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	const fileLink = await uploadFileToDrive(files, folderId, driveId)
	return NextResponse.json({ fileLink }, { status: 200 })
}
