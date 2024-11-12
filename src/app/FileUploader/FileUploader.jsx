'use client'

import { useState, useRef } from 'react'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks

export default function FileUploader() {
	const [file, setFile] = useState(null)
	const [uploading, setUploading] = useState(false)
	const [progress, setProgress] = useState(null)
	const abortControllerRef = useRef(null)

	const handleFileSelect = (event) => {
		const selectedFile = event.target.files?.[0]
		if (selectedFile) {
			setFile(selectedFile)
			setProgress(null)
		}
	}

	const initiateUpload = async () => {
		if (!file) return

		try {
			const response = await fetch('/api/initiate-upload', {
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

			if (!response.ok) {
				throw new Error('Failed to initiate upload')
			}

			const { uploadUrl } = await response.json()
			return uploadUrl
		} catch (error) {
			console.error('Failed to initiate upload:', error)
			throw error
		}
	}

	const uploadChunk = async (chunk, start, uploadUrl) => {
		const end = Math.min(start + chunk.size, file.size)

		return fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
				'Content-Length': chunk.size.toString(),
			},
			body: chunk,
			signal: abortControllerRef.current?.signal,
		})
	}

	const startUpload = async () => {
		if (!file || uploading) return

		try {
			setUploading(true)
			abortControllerRef.current = new AbortController()

			const uploadUrl = await initiateUpload()
			let uploadedBytes = 0

			while (uploadedBytes < file.size) {
				const chunk = file.slice(
					uploadedBytes,
					uploadedBytes + CHUNK_SIZE
				)
				const response = await uploadChunk(
					chunk,
					uploadedBytes,
					uploadUrl
				)

				if (response.status === 200 || response.status === 201) {
					// Upload completed
					setProgress({
						uploadedBytes: file.size,
						totalBytes: file.size,
						percentage: 100,
					})
					break
				} else if (response.status === 308) {
					// Incomplete - get the range from the response
					const range = response.headers.get('Range')
					if (range) {
						uploadedBytes = parseInt(range.split('-')[1]) + 1
					} else {
						uploadedBytes += chunk.size
					}

					setProgress({
						uploadedBytes,
						totalBytes: file.size,
						percentage: Math.round(
							(uploadedBytes / file.size) * 100
						),
					})
				} else {
					throw new Error(`Unexpected response: ${response.status}`)
				}
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('Upload cancelled')
			} else {
				console.error('Upload failed:', error)
			}
		} finally {
			setUploading(false)
			abortControllerRef.current = null
		}
	}
	const testUpload = async () => {
		const smallFile = new File(['test content'], 'test.txt', {
			type: 'text/plain',
		})
		const response = await fetch('/api/initiate-upload', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				filename: 'test.txt',
				mimeType: 'text/plain',
				fileSize: smallFile.size,
			}),
		})
		return await response.json()
	}

	const cancelUpload = () => {
		abortControllerRef.current?.abort()
	}

	return (
		<div className='max-w-md mx-auto p-4'>
			<div className='mb-4'>
				<input
					type='file'
					onChange={handleFileSelect}
					disabled={uploading}
					className='mb-2'
				/>
				{file && (
					<div className='text-sm text-gray-600'>
						Selected: {file.name} (
						{(file.size / (1024 * 1024)).toFixed(2)} MB)
					</div>
				)}
			</div>

			{progress && (
				<div className='mb-4'>
					<div className='w-full bg-gray-200 rounded-full h-2.5'>
						<div
							className='bg-blue-600 h-2.5 rounded-full'
							style={{ width: `${progress.percentage}%` }}
						></div>
					</div>
					<div className='text-sm text-gray-600 mt-1'>
						{(progress.uploadedBytes / (1024 * 1024)).toFixed(2)} MB
						of {(progress.totalBytes / (1024 * 1024)).toFixed(2)} MB
						({progress.percentage}%)
					</div>
				</div>
			)}

			<div className='flex gap-2'>
				<button
					// onClick={startUpload}
					onClick={testUpload}
					// disabled={!file || uploading}
					// className={`px-4 py-2 rounded ${
					// 	!file || uploading
					// 		? 'bg-gray-300 cursor-not-allowed'
					// 		: 'bg-blue-500 hover:bg-blue-600 text-white'
					// }`}
				>
					{uploading ? 'Uploading...' : 'Start Upload'}
				</button>

				{uploading && (
					<button
						onClick={cancelUpload}
						className='px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white'
					>
						Cancel
					</button>
				)}
			</div>
		</div>
	)
}
