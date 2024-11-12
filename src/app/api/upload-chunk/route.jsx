// app/api/upload-chunk/route.js
import { headers } from 'next/headers'

export async function POST(request) {
	try {
		// Get the content type header to handle multipart form data
		const contentType = headers().get('content-type') || ''

		// Parse the form data
		const formData = await request.formData()
		const uploadUrl = formData.get('uploadUrl')
		const chunk = formData.get('chunk')
		const start = parseInt(formData.get('start') || '0')
		const total = parseInt(formData.get('total') || '0')

		console.log('Received chunk:', {
			start,
			chunkSize: chunk?.size,
			total,
			uploadUrl: uploadUrl ? 'present' : 'missing',
		})

		if (!uploadUrl || !chunk) {
			throw new Error('Missing required upload parameters')
		}

		// Calculate content range
		const end = start + chunk.size - 1
		const contentRange = `bytes ${start}-${end}/${total}`

		console.log('Uploading chunk with range:', contentRange)

		// Forward the chunk to Google Drive
		const response = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'Content-Range': contentRange,
				'Content-Length': chunk.size.toString(),
				'Content-Type': chunk.type,
			},
			body: chunk,
		})

		console.log('Upload response:', {
			status: response.status,
			statusText: response.statusText,
		})

		let responseData = {}

		if (response.status === 200 || response.status === 201) {
			// Upload completed
			responseData = await response.json()
		} else if (response.status === 308) {
			// Incomplete - get the range from the response
			const range = response.headers.get('Range')
			const nextByte = range
				? parseInt(range.split('-')[1]) + 1
				: start + chunk.size
			responseData = { nextByte }
		}

		return new Response(
			JSON.stringify({
				status: response.status,
				data: responseData,
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	} catch (error) {
		console.error('Chunk upload error:', error)
		return new Response(
			JSON.stringify({
				error: error.message,
				details: error.stack,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		)
	}
}
