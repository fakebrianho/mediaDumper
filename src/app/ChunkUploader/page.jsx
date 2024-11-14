// app/components/ChunkUploader.jsx
'use client'

import { useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import Confetti from '@/components/magicui/confetti'
import CreateFolder from '../_fileUploader/components/CreateFolder'

const CHUNK_SIZE = 256 * 1024 // 256KB chunks

export default function ChunkUploader() {
	const [files, setFiles] = useState([])
	const [folderId, setFolderId] = useState(null)
	const [folderName, setFolderName] = useState(null)
	const [uploading, setUploading] = useState(false)
	const [progress, setProgress] = useState({})
	const [errors, setErrors] = useState({})

	const abortControllerRef = useRef(null)
	const folderRef = useRef(null)
	const confettiRef = useRef(null)

	// Dropzone configuration
	const onDrop = (acceptedFiles) => {
		setFiles(acceptedFiles)
		setProgress({}) // Clear previous progress
		setErrors({}) // Clear previous errors
	}

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		multiple: true, // Allow multiple files
	})

	const createFolder = async () => {
		if (!folderName) return

		const body = {
			folderId: process.env.NEXT_PUBLIC_SHARED_DRIVE_ID,
			folderName,
		}
		try {
			const res = await fetch('/api/createFolder', {
				method: 'POST',
				body: JSON.stringify(body),
			})
			const data = await res.json()
			const id = data.folder.id
			setFolderId(id)
			return id
		} catch (e) {
			console.error('Folder creation error:', e)
			setErrors((prev) => ({
				...prev,
				folder: 'Failed to create folder',
			}))
			return null
		}
	}

	const uploadChunk = async (chunk, start, uploadUrl, fileName, fileSize) => {
		const formData = new FormData()
		formData.append('chunk', chunk)
		formData.append('uploadUrl', uploadUrl)
		formData.append('start', start.toString())
		formData.append('total', fileSize.toString())

		const response = await fetch('/api/upload-chunk', {
			method: 'POST',
			body: formData,
		})

		if (!response.ok) {
			throw new Error(`Chunk upload failed for ${fileName}`)
		}

		return response.json()
	}

	const startBulkUpload = async () => {
		if (!files.length || uploading) return

		try {
			setUploading(true)
			setErrors({})

			// Create folder if name is provided
			const targetFolderId = folderName ? await createFolder() : folderId
			if (!targetFolderId) {
				throw new Error('No target folder selected')
			}

			// Initialize upload sessions for all files
			const initResponse = await fetch('/api/initiate-upload', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					files: files.map((file) => ({
						name: file.name,
						mimeType: file.type,
						size: file.size,
					})),
					folderId: targetFolderId,
				}),
			})

			if (!initResponse.ok) {
				throw new Error('Failed to initiate bulk upload')
			}

			const { sessions } = await initResponse.json()

			// Upload files sequentially to avoid overwhelming the server
			for (const [index, session] of sessions.entries()) {
				if (session.error) {
					setErrors((prev) => ({
						...prev,
						[session.filename]: session.error,
					}))
					continue
				}

				const file = files[index]
				let uploadedBytes = 0

				while (uploadedBytes < file.size) {
					const chunk = file.slice(
						uploadedBytes,
						uploadedBytes + CHUNK_SIZE
					)
					try {
						const response = await uploadChunk(
							chunk,
							uploadedBytes,
							session.uploadUrl,
							file.name,
							file.size
						)

						if (
							response.status === 200 ||
							response.status === 201
						) {
							setProgress((prev) => ({
								...prev,
								[file.name]: 100,
							}))
							break
						} else if (response.status === 308) {
							uploadedBytes = response.data.nextByte
							setProgress((prev) => ({
								...prev,
								[file.name]: Math.round(
									(uploadedBytes / file.size) * 100
								),
							}))
						}
					} catch (error) {
						setErrors((prev) => ({
							...prev,
							[file.name]: error.message,
						}))
						break
					}
				}
			}

			// If all uploads completed successfully, trigger confetti
			if (Object.values(progress).every((p) => p === 100)) {
				confettiRef.current?.fire()
			}
		} catch (error) {
			console.error('Bulk upload failed:', error)
			setErrors((prev) => ({
				...prev,
				general: error.message,
			}))
		} finally {
			setUploading(false)
		}
	}

	return (
		<div className='max-w-4xl mx-auto p-4'>
			<Confetti
				ref={confettiRef}
				className='absolute left-0 top-0 z-[-1] size-full'
			/>

			<CreateFolder
				ref={folderRef}
				folderName={folderName}
				setFolderName={setFolderName}
				createFolder={createFolder}
			/>

			{folderId && (
				<p className='mt-4 text-sm text-gray-600'>
					Folder Link:{' '}
					{`https://drive.google.com/drive/folders/${folderId}`}
				</p>
			)}

			<div className='mt-6'>
				<div
					{...getRootProps()}
					className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
						isDragActive
							? 'border-blue-400 bg-blue-50'
							: 'border-gray-300 hover:border-gray-400'
					}`}
				>
					<input {...getInputProps()} />
					<p className='text-gray-600'>
						{isDragActive
							? 'Drop the files here...'
							: 'Drag & drop files here, or click to select files'}
					</p>
				</div>

				{files.length > 0 && (
					<div className='mt-4'>
						<h3 className='font-semibold mb-2'>Selected Files:</h3>
						<div className='max-h-60 overflow-y-auto'>
							{files.map((file) => (
								<div key={file.name} className='mb-4'>
									<div className='flex justify-between text-sm mb-1'>
										<span className='truncate'>
											{file.name}
										</span>
										<span>{progress[file.name] || 0}%</span>
									</div>
									<div className='w-full bg-gray-200 rounded-full h-2'>
										<div
											className='bg-blue-600 h-2 rounded-full transition-all duration-300'
											style={{
												width: `${
													progress[file.name] || 0
												}%`,
											}}
										/>
									</div>
									{errors[file.name] && (
										<p className='text-red-500 text-sm mt-1'>
											{errors[file.name]}
										</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{errors.general && (
					<p className='text-red-500 mt-4'>{errors.general}</p>
				)}

				<div className='mt-4 flex justify-end gap-4'>
					{files.length > 0 && (
						<button
							onClick={() => {
								setFiles([])
								setProgress({})
								setErrors({})
							}}
							className='px-4 py-2 text-gray-600 hover:text-gray-800'
						>
							Clear All
						</button>
					)}
					<button
						onClick={startBulkUpload}
						disabled={!files.length || uploading || !folderId}
						className={`px-6 py-2 rounded-lg ${
							!files.length || uploading || !folderId
								? 'bg-gray-300 cursor-not-allowed'
								: 'bg-blue-500 hover:bg-blue-600 text-white'
						}`}
					>
						{uploading ? 'Uploading...' : 'Upload Files'}
					</button>
				</div>
			</div>
		</div>
	)
}
