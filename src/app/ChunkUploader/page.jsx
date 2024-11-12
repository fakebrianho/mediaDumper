// app/components/ChunkUploader.jsx
'use client'

import { useState, useRef } from 'react'
import CreateFolder from '../_fileUploader/components/CreateFolder'

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
// const driveId = process.env.GOOGLE_FOLDER_ID
const driveId = process.env.NEXT_PUBLIC_SHARED_DRIVE_ID

export default function ChunkUploader() {
	const [file, setFile] = useState(null)
	const [folderId, setFolderId] = useState(null)
	const [folderName, setFolderName] = useState(null)
	const [uploading, setUploading] = useState(false)
	const [progress, setProgress] = useState(null)
	const abortControllerRef = useRef(null)
	const folderRef = useRef(null)

	const handleFileSelect = (event) => {
		const selectedFile = event.target.files?.[0]
		if (selectedFile) {
			setFile(selectedFile)
			setProgress(null)
		}
	}

	const createFolder = async () => {
		const body = {
			folderId: driveId,
			folderName,
		}
		const res = await fetch('/api/createFolder', {
			method: 'POST',
			body: JSON.stringify(body),
		})
		const data = await res.json()
		try {
			console.log(data)
			const id = data.folder.id
			const link = `https://drive.google.com/drive/folders/${id}`
			setFolderId(id)
		} catch (e) {
			console.log(e)
		}
	}

	const uploadChunk = async (chunk, start, uploadUrl) => {
		const formData = new FormData()
		formData.append('chunk', chunk)
		formData.append('uploadUrl', uploadUrl)
		formData.append('start', start.toString())
		formData.append('total', file.size.toString())

		const response = await fetch('/api/upload-chunk', {
			method: 'POST',
			body: formData,
		})

		if (!response.ok) {
			throw new Error('Chunk upload failed')
		}

		return response.json()
	}

	const startUpload = async () => {
		if (!file || uploading) return

		try {
			setUploading(true)
			abortControllerRef.current = new AbortController()

			// Initialize upload
			const initResponse = await fetch('/api/initiate-upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					filename: file.name,
					mimeType: file.type,
					fileSize: file.size,
					folderId: folderId,
				}),
			})

			if (!initResponse.ok) {
				throw new Error('Failed to initiate upload')
			}

			const { uploadUrl } = await initResponse.json()
			let uploadedBytes = 0

			// Upload chunks
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
					// Incomplete - update progress
					uploadedBytes = response.data.nextByte
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
			console.error('Upload failed:', error)
			setProgress(null)
		} finally {
			setUploading(false)
			abortControllerRef.current = null
		}
	}

	const cancelUpload = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			setUploading(false)
			setProgress(null)
		}
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
			<CreateFolder
				// authenticated={props.authenticated}
				ref={folderRef}
				folderName={folderName}
				setFolderName={setFolderName}
				createFolder={createFolder}
			/>
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
			<p className='mt-11'>{`https://drive.google.com/drive/folders/${folderId}`}</p>

			<div className='flex gap-2'>
				<button
					onClick={startUpload}
					disabled={!file || uploading}
					className={`px-4 py-2 rounded ${
						!file || uploading
							? 'bg-gray-300 cursor-not-allowed'
							: 'bg-blue-500 hover:bg-blue-600 text-white'
					}`}
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
