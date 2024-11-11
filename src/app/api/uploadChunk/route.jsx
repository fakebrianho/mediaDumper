// app/api/uploadChunk/route.jsx
import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const chunksStore = new Map()

// Function to get a resumable upload URL from Google Drive
async function getUploadUrl(auth, fileName, folderId) {
	console.log('Creating file in Drive with params:', { fileName, folderId })

	try {
		// Get the access token
		const accessToken = await auth.getAccessToken()

		// Make a POST request to initiate a resumable upload session
		const response = await fetch(
			'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
					'X-Upload-Content-Type': 'application/octet-stream',
				},
				body: JSON.stringify({
					name: fileName,
					parents: [folderId],
					driveId: process.env.NEXT_PUBLIC_SHARED_DRIVE_ID,
					supportsAllDrives: true,
					supportsTeamDrives: true,
				}),
			}
		)

		console.log('Session initiation response:', {
			status: response.status,
			headers: Object.fromEntries(response.headers),
		})

		if (!response.ok) {
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
		console.error('Error getting upload URL:', error)
		throw error
	}
}

export async function POST(request) {
	const clonedRequest = request.clone()

	try {
		const formData = await request.formData()
		const chunk = formData.get('chunk')
		const fileName = formData.get('fileName')
		const chunkIndex = parseInt(formData.get('chunkIndex'))
		const totalChunks = parseInt(formData.get('totalChunks'))
		const fileId = formData.get('fileId')
		const folderId = formData.get('folderId')

		const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
		const chunkSize = chunkBuffer.length

		let storedData = chunksStore.get(fileId)

		// Initialize upload only if we don't have a valid upload URL
		if (!storedData?.uploadUrl) {
			console.log('Initializing new upload session for:', fileId)
			const auth = new google.auth.GoogleAuth({
				credentials: {
					type: 'service_account',
					private_key: process.env.NEXT_PUBLIC_PRIVATE_KEY?.replace(
						/\\n/g,
						'\n'
					),
					client_email: process.env.NEXT_PUBLIC_CLIENT_EMAIL,
					client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
					token_uri: 'https://oauth2.googleapis.com/token',
					universe_domain: 'googleapis.com',
				},
				scopes: [
					'https://www.googleapis.com/auth/drive.file',
					'https://www.googleapis.com/auth/drive',
				],
			})

			const uploadUrl = await getUploadUrl(auth, fileName, folderId)
			storedData = { uploadUrl, totalSize: 0 }
			chunksStore.set(fileId, storedData)
		}

		const { uploadUrl, totalSize } = storedData
		const start = totalSize
		const end = start + chunkSize - 1
		const total = totalChunks * chunkSize

		console.log('Uploading chunk:', {
			fileId,
			chunkIndex,
			start,
			end,
			total,
			chunkSize,
			uploadUrl: uploadUrl.substring(0, 50) + '...',
		})

		// Upload the chunk
		const uploadResponse = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'Content-Length': chunkSize.toString(),
				'Content-Range': `bytes ${start}-${end}/${total}`,
				'Content-Type': 'application/octet-stream',
			},
			body: chunkBuffer,
			query: {
				supportsAllDrives: true,
				supportsTeamDrives: true,
			},
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
			// Clear the stored upload URL to force a new session
			chunksStore.delete(fileId)

			// Return a specific error that indicates we need to retry from the beginning
			return NextResponse.json(
				{
					error: 'Upload session expired',
					retry: true,
					newSession: true,
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
