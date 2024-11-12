import { NextResponse } from 'next/server'
import { authenticateGoogle } from '../createFolder/route'
import { google } from 'googleapis' // Import the Google APIs

export async function POST(req) {
	try {
		const formData = await req.formData()
		const file = formData.get('file')
		const folderId = formData.get('folderId')

		if (!file || !folderId) {
			return NextResponse.json(
				{ error: 'Missing file or folderId' },
				{ status: 400 }
			)
		}

		// 1. Get auth token using your working auth method
		const auth = authenticateGoogle()
		const accessToken = await auth.getAccessToken()

		// 2. Initialize upload session
		console.log('Initializing upload session for:', file.name)
		const sessionResponse = await fetch(
			'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken.token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: file.name,
					parents: [folderId],
				}),
			}
		)

		if (!sessionResponse.ok) {
			const error = await sessionResponse.text()
			console.error('Session initialization failed:', error)
			return NextResponse.json(
				{ error: 'Failed to initialize upload' },
				{ status: 500 }
			)
		}

		// 3. Get the upload URL from the session response
		const uploadUrl = sessionResponse.headers.get('location')
		if (!uploadUrl) {
			return NextResponse.json(
				{ error: 'No upload URL received' },
				{ status: 500 }
			)
		}

		// 4. Upload the entire file
		const fileBuffer = await file.arrayBuffer()
		const uploadResponse = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'Content-Length': fileBuffer.byteLength.toString(),
				'Content-Type': 'application/octet-stream',
			},
			body: fileBuffer,
		})

		if (!uploadResponse.ok) {
			const error = await uploadResponse.text()
			console.error('Upload failed:', error)
			return NextResponse.json(
				{ error: 'Upload failed' },
				{ status: 500 }
			)
		}

		const result = await uploadResponse.json()
		return NextResponse.json({
			success: true,
			fileId: result.id,
			webViewLink: result.webViewLink,
		})
	} catch (error) {
		console.error('Upload error:', error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}
