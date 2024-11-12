// app/api/uploadChunk/route.jsx
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { authenticateGoogle } from '../createFolder/route'

const chunksStore = new Map()

async function getUploadUrl(auth, fileName, folderId) {
	console.log('Creating file in Drive with params:', { fileName, folderId })

	try {
		const drive = google.drive({ version: 'v3', auth })
		const accessToken = await auth.getAccessToken()

		const response = await fetch(
			'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken.token}`,
					'Content-Type': 'application/json',
					'X-Upload-Content-Type': 'application/octet-stream',
				},
				body: JSON.stringify({
					name: fileName,
					parents: [folderId],
					supportsAllDrives: true,
				}),
			}
		)

		console.log('Session initiation response:', {
			status: response.status,
			headers: Object.fromEntries(response.headers),
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('Upload session initiation failed:', errorText)
			throw new Error(
				`Failed to initiate upload session: ${response.status} ${response.statusText}`
			)
		}

		const uploadUrl = response.headers.get('location')
		if (!uploadUrl) {
			throw new Error('No upload URL in response headers')
		}

		return uploadUrl
	} catch (error) {
		console.error('Detailed auth error:', error)
		throw error
	}
}

export async function POST(req) {
	try {
		const formData = await req.formData()
		const chunk = formData.get('chunk')
		const fileName = formData.get('fileName')
		const chunkIndex = parseInt(formData.get('chunkIndex'))
		const fileId = formData.get('fileId')
		const folderId = formData.get('folderId')

		if (!chunk || !fileName || isNaN(chunkIndex) || !fileId || !folderId) {
			return NextResponse.json(
				{ error: 'Missing required parameters' },
				{ status: 400 }
			)
		}

		console.log('Folder ID being used:', folderId)

		// Use the working authentication method
		const auth = authenticateGoogle()

		const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
		const chunkSize = chunkBuffer.length
		const start = chunkIndex * chunkSize
		const end = start + chunkSize - 1
		const total = chunkSize

		let uploadUrl = chunksStore.get(fileId)
		if (!uploadUrl) {
			uploadUrl = await getUploadUrl(auth, fileName, folderId)
			chunksStore.set(fileId, uploadUrl)
		}

		const uploadResponse = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'Content-Length': chunkSize.toString(),
				'Content-Range': `bytes ${start}-${end}/${total}`,
				'Content-Type': 'application/octet-stream',
			},
			body: chunkBuffer,
		})

		console.log('Upload response:', {
			status: uploadResponse.status,
			statusText: uploadResponse.statusText,
			headers: Object.fromEntries(uploadResponse.headers),
		})

		// Handle the response
		if (uploadResponse.status === 308) {
			// Incomplete - more chunks needed
			const range = uploadResponse.headers.get('range')
			const newEnd = range ? parseInt(range.split('-')[1]) + 1 : end + 1
			chunksStore.set(fileId, { uploadUrl, totalSize: newEnd })
			return NextResponse.json({ success: true, resumeFrom: newEnd })
		} else if (
			uploadResponse.status === 200 ||
			uploadResponse.status === 201
		) {
			// Upload complete
			chunksStore.delete(fileId)
			const result = await uploadResponse.json()
			return NextResponse.json({
				success: true,
				fileId: result.id,
				complete: true,
			})
		} else if (uploadResponse.status === 404) {
			// Add detailed error logging
			const errorResponse = await uploadResponse.text()
			console.error(
				'Upload session expired. Error details:',
				errorResponse
			)

			// Clear the stored upload URL to force a new session
			chunksStore.delete(fileId)

			// Return a specific error that indicates we need to retry from the beginning
			return NextResponse.json(
				{
					error: 'Upload session expired',
					retry: true,
					newSession: true,
					details: errorResponse,
				},
				{ status: 404 }
			)
		}

		throw new Error(`Upload failed with status ${uploadResponse.status}`)
	} catch (error) {
		console.error('Upload error:', error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
