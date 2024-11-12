// app/test/page.jsx
'use client'

import { useState } from 'react'

export default function TestUpload() {
	const [status, setStatus] = useState('')
	const [error, setError] = useState('')

	const runTest = async () => {
		try {
			setStatus('Creating test file...')
			const testContent = 'Hello, World!'
			const file = new File([testContent], 'test.txt', {
				type: 'text/plain',
			})

			setStatus('Initiating upload...')
			const initResult = await fetch('/api/initiate-upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					filename: file.name,
					mimeType: file.type,
					fileSize: file.size,
				}),
			})

			if (!initResult.ok) {
				const errorData = await initResult.json()
				throw new Error(
					`Upload initiation failed: ${JSON.stringify(errorData)}`
				)
			}

			const { uploadUrl } = await initResult.json()
			setStatus('Got upload URL. Uploading file...')

			// Upload the file
			const uploadResult = await fetch(uploadUrl, {
				method: 'PUT',
				headers: {
					'Content-Type': file.type,
					'Content-Length': String(file.size),
				},
				body: file,
			})

			if (!uploadResult.ok) {
				const errorText = await uploadResult.text()
				throw new Error(
					`Upload failed with status: ${uploadResult.status} - ${errorText}`
				)
			}

			// Don't try to parse JSON, just check status
			setStatus(`Upload complete! Status: ${uploadResult.status}`)
			setError('')

			// Optional: Verify the upload by checking the file exists
			await verifyUpload(file.name)
		} catch (err) {
			console.error('Test failed:', err)
			setError(err.message)
			setStatus('Failed')
		}
	}

	// Optional verification function
	const verifyUpload = async (filename) => {
		try {
			const verifyResponse = await fetch(
				`/api/verify-upload?filename=${encodeURIComponent(filename)}`
			)
			if (!verifyResponse.ok) {
				throw new Error('Failed to verify upload')
			}
			const data = await verifyResponse.json()
			setStatus(`Upload verified! File ID: ${data.id}`)
		} catch (err) {
			console.warn('Upload verification failed:', err)
			// Don't throw - the upload might still have succeeded
		}
	}

	return (
		<div className='p-4'>
			<button
				onClick={runTest}
				className='bg-blue-500 text-white px-4 py-2 rounded mb-4'
			>
				Run Upload Test
			</button>

			{status && (
				<div className='mb-2 text-gray-700'>Status: {status}</div>
			)}

			{error && <div className='text-red-500'>Error: {error}</div>}
		</div>
	)
}
