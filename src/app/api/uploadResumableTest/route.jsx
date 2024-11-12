import { NextResponse } from 'next/server'
import { authenticateGoogle } from '../createFolder/route'
import { google } from 'googleapis'

export async function POST(req) {
	try {
		const contentType = req.headers.get('Content-Type') || ''
		const actionHeader = req.headers.get('Action')

		if (actionHeader === 'upload_chunk') {
			// **Handle Chunk Upload Request**

			// **Extract Necessary Headers**
			const uploadUrl = req.headers.get('Upload-URL')
			const contentRange = req.headers.get('Content-Range')
			const mimeType = req.headers.get('Content-Type')

			if (!uploadUrl || !contentRange || !mimeType) {
				return NextResponse.json(
					{ error: 'Missing required headers' },
					{ status: 400 }
				)
			}

			// **Read Chunk Data from Request Body**
			const chunkBuffer = await req.arrayBuffer()

			// **Forward Chunk to Google's uploadUrl**
			const uploadResponse = await fetch(uploadUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': mimeType,
					'Content-Range': contentRange,
				},
				body: chunkBuffer,
			})

			const status = uploadResponse.status

			if (status === 308) {
				// **Upload Incomplete, Continue Uploading**
				return NextResponse.json({ status: 'incomplete' })
			} else if (status === 200 || status === 201) {
				// **Upload Complete**
				const fileData = await uploadResponse.json()
				return NextResponse.json({ status: 'complete', fileData })
			} else {
				// **Handle Errors**
				const errorText = await uploadResponse.text()
				console.error('Upload chunk failed:', errorText)
				return NextResponse.json(
					{
						error: `Upload failed with status ${status}: ${errorText}`,
					},
					{ status: status }
				)
			}
		} else {
			// **Handle Initialization Request**

			// **Parse JSON Body**
			const body = await req.json()
			const { action, fileName, mimeType, fileSize, folderId } = body

			console.log('Received upload request for:', {
				fileName: fileName,
				folderId: folderId,
				fileSize: fileSize,
				action: action,
			})

			// **Validate Required Fields**
			if (!action || !fileName || !mimeType || !fileSize || !folderId) {
				return NextResponse.json(
					{ error: 'Missing required fields' },
					{ status: 400 }
				)
			}

			if (action === 'initialize') {
				console.log(
					`Initializing upload for file: ${fileName} in folder: ${folderId}`
				)

				// **Authenticate with Google Drive**
				const auth = authenticateGoogle()
				const drive = google.drive({ version: 'v3', auth })

				try {
					// **Initialize Resumable Upload Session**
					const res = await drive.files.create(
						{
							requestBody: {
								name: fileName,
								parents: [folderId],
							},
							media: {
								mimeType: mimeType,
							},
							fields: 'id',
						},
						{
							params: {
								uploadType: 'resumable',
								supportsAllDrives: true, // **Placed correctly here**
							},
							headers: {
								'X-Upload-Content-Length': fileSize.toString(),
								'X-Upload-Content-Type': mimeType,
							},
						}
					)

					const uploadUrl = res.headers.location

					if (!uploadUrl) {
						console.error(
							'No upload URL received from Google Drive'
						)
						return NextResponse.json(
							{
								error: 'No upload URL received from Google Drive',
							},
							{ status: 500 }
						)
					}

					console.log(
						'Upload session initialized. Upload URL:',
						uploadUrl
					)

					// **Return Upload URL to Frontend**
					return NextResponse.json({
						uploadUrl: uploadUrl,
						bytesUploaded: 0,
					})
				} catch (error) {
					console.error('Error initializing upload session:', error)
					return NextResponse.json(
						{
							error:
								error.message ||
								'Failed to initialize upload session',
						},
						{ status: 500 }
					)
				}
			} else {
				return NextResponse.json(
					{ error: 'Invalid action' },
					{ status: 400 }
				)
			}
		}
	} catch (error) {
		console.error('Upload error:', error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}
