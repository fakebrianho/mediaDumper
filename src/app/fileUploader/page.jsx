'use client'
import { useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import CreateFolder from './components/CreateFolder'
import ShineBorder from '@/components/magicui/shine-border'
import gsap from 'gsap'
import PulsatingButton from '@/components/ui/pulsating-button'
import Confetti from '@/components/magicui/confetti'

// Constants should be outside component
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
const driveId = process.env.NEXT_PUBLIC_SHARED_DRIVE_ID

function Page(props) {
	// All state declarations grouped together
	const [uploadProgress, setUploadProgress] = useState({}) // Track progress for each file
	const [activeUploads, setActiveUploads] = useState(0) // Number of files currently uploading
	const [uploadStatus, setUploadStatus] = useState('') // Status message for uploads
	const [folderId, setFolderId] = useState(null)
	const [folderName, setFolderName] = useState(null)
	const [file, setFile] = useState(null)
	const [files, setFiles] = useState([])

	// All refs grouped together
	const folderRef = useRef(null)
	const containerRef = useRef(null)
	const uploadRef = useRef(null)
	const listRef = useRef(null)
	const uploadButtonRef = useRef(null)
	const confettiRef = useRef(null)

	// Upload handling functions
	const uploadFileChunks = async (file, folderId) => {
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
		const fileId = `${file.name}-${Date.now()}`

		// Initialize progress for this file
		setUploadProgress((prev) => ({
			...prev,
			[fileId]: 0,
		}))

		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * CHUNK_SIZE
			const end = Math.min(start + CHUNK_SIZE, file.size)
			const chunk = file.slice(start, end)

			const formData = new FormData()
			formData.append('chunk', chunk)
			formData.append('fileName', file.name)
			formData.append('chunkIndex', chunkIndex.toString())
			formData.append('totalChunks', totalChunks.toString())
			formData.append('fileId', fileId)
			formData.append('folderId', folderId)
			formData.append('driveId', driveId)

			try {
				const res = await fetch('/api/uploadChunk', {
					method: 'POST',
					body: formData,
				})

				if (!res.ok) {
					const data = await res.json()
					if (res.status === 404 && data.newSession) {
						// Clear stored progress and restart the chunk upload
						setUploadProgress((prev) => ({
							...prev,
							[fileId]: 0,
						}))
						chunkIndex = -1 // Will be incremented to 0 in next loop iteration
						continue
					}
					throw new Error(`Chunk upload failed: ${res.statusText}`)
				}

				// Update progress for this file
				const progress = ((chunkIndex + 1) / totalChunks) * 100
				setUploadProgress((prev) => ({
					...prev,
					[fileId]: progress,
				}))

				// Update status message
				setUploadStatus(
					`Uploading ${file.name}: ${progress.toFixed(1)}%`
				)
			} catch (error) {
				console.error(
					`Error uploading chunk ${chunkIndex} of ${file.name}:`,
					error
				)
				setUploadStatus(`Error uploading ${file.name}`)
				throw error
			}
		}

		return fileId
	}

	const uploadFile = async () => {
		if (files.length === 0) return

		if (uploadButtonRef.current) {
			uploadButtonRef.current.innerHTML = 'Uploading...'
		}

		setActiveUploads(files.length)
		setUploadStatus('Starting uploads...')

		try {
			await Promise.all(
				files.map(async (file) => {
					try {
						await uploadFileChunks(file, folderId)
						setActiveUploads((prev) => prev - 1)
					} catch (error) {
						console.error(`Failed to upload ${file.name}:`, error)
						setUploadStatus(`Failed to upload ${file.name}`)
					}
				})
			)

			// All uploads completed
			clearFiles()
			if (uploadButtonRef.current) {
				uploadButtonRef.current.innerHTML = 'Upload Files'
			}
			setUploadStatus('All uploads completed!')
			success()
		} catch (error) {
			console.error('Upload failed:', error)
			if (uploadButtonRef.current) {
				uploadButtonRef.current.innerHTML = 'Upload Failed - Try Again'
			}
			setUploadStatus('Upload failed. Please try again.')
		}
	}

	const clearFiles = () => {
		setFiles([])
		setUploadProgress({})
		setActiveUploads(0)
		setUploadStatus('')
		setTimeout(() => {
			success()
		}, 10)
	}

	const onDrop = (acceptedFiles) => {
		setFiles(acceptedFiles)
		setUploadProgress({}) // Clear previous upload progress
		setUploadStatus('Files ready to upload')
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
		const id = data.folder.data.id
		const link = `https://drive.google.com/drive/folders/${id}`
		setFolderId(id)
	}

	const success = () => {
		if (confettiRef.current) {
			confettiRef.current.fire()
		}
	}

	const containerIn = () => {
		gsap.to(containerRef.current, {
			opacity: 1,
			duration: 2,
			ease: 'power1.easeInOut',
		})
		gsap.to(containerRef.current, {
			scale: 1,
			duration: 1.5,
			ease: 'power1.easeInOut',
		})
		gsap.to(folderRef.current, {
			top: '0',
			duration: 1,
			ease: 'power1.easeInOut',
		})
	}

	useEffect(() => {
		gsap.set(containerRef.current, {
			scale: 0.85,
		})
		if (props.authenticated) {
			containerIn()
		}
	}, [props.authenticated])

	useEffect(() => {
		if (folderId !== null) {
			gsap.to(folderRef.current, {
				top: '-2.75rem',
				duration: 1,
				ease: 'power1.easeinout',
			})
			gsap.to(folderRef.current, {
				opacity: 0,
				duration: 1,
				ease: 'power1.easeinout',
			})
			gsap.to(uploadRef.current, {
				top: '15%',
				duration: 1,
				ease: 'power1.easeinout',
				delay: 1,
			})
			gsap.to(uploadRef.current, {
				zIndex: 15,
				duration: 1,
				ease: 'power1.easeinout',
				delay: 1,
			})
			gsap.to(uploadRef.current, {
				opacity: 1,
				duration: 1,
				ease: 'power1.easeinout',
				delay: 1,
			})
		}
	}, [folderId])

	const { getRootProps, getInputProps } = useDropzone({ onDrop })

	return (
		<div>
			<Confetti
				ref={confettiRef}
				className='absolute left-0 top-0 z-[-1] size-full'
			/>
			<div
				className='flex items-center justify-center h-[40vh] w-[60vh] opacity-0'
				ref={containerRef}
			>
				<ShineBorder
					className='glass relative flex h-full w-full flex-row items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl'
					color={['#A07CFE', '#FE8FB5', '#FFBE7B']}
				>
					<CreateFolder
						authenticated={props.authenticated}
						ref={folderRef}
						folderName={folderName}
						setFolderName={setFolderName}
						createFolder={createFolder}
					/>

					<div
						className='absolute z-[-10] opacity-0 top-[5%] w-[90%] h-[75%] flex items-center gap-4 flex-col'
						ref={uploadRef}
					>
						<PulsatingButton onClick={uploadFile}>
							<p ref={uploadButtonRef}>Upload Files</p>
						</PulsatingButton>

						<div
							{...getRootProps({ className: 'dropzone' })}
							className='border-2 border-dashed border-gray-300 p-5 text-center h-[60%] w-[90%] overflow-y-auto max-h-[400px]'
						>
							<input {...getInputProps()} />
							{files.length === 0 ? (
								<p>
									Drag & drop some files here, or click to
									select files
								</p>
							) : (
								<ul ref={listRef} className='opacity-100'>
									{files.map((file) => (
										<li
											key={file.name}
											className='text-sm mb-2'
										>
											{file.name} (
											{(file.size / 1024 / 1024).toFixed(
												2
											)}{' '}
											MB)
										</li>
									))}
								</ul>
							)}
						</div>

						{/* Upload Progress Section */}
						{Object.entries(uploadProgress).length > 0 && (
							<div className='w-full space-y-4'>
								{Object.entries(uploadProgress).map(
									([fileId, progress]) => (
										<div key={fileId} className='w-full'>
											<div className='flex justify-between text-sm text-gray-600 mb-1'>
												<span>
													{fileId.split('-')[0]}
												</span>
												<span>
													{progress.toFixed(1)}%
												</span>
											</div>
											<div className='w-full bg-gray-200 rounded-full h-2'>
												<div
													className='bg-blue-600 h-2 rounded-full transition-all duration-300'
													style={{
														width: `${progress}%`,
													}}
												/>
											</div>
										</div>
									)
								)}
							</div>
						)}

						{/* Upload Status Message */}
						{uploadStatus && (
							<div className='text-sm text-gray-600 mt-2'>
								{uploadStatus}
							</div>
						)}

						{/* Active Uploads Counter */}
						{activeUploads > 0 && (
							<div className='text-sm text-gray-600'>
								{activeUploads} file
								{activeUploads !== 1 ? 's' : ''} remaining
							</div>
						)}
					</div>
				</ShineBorder>
			</div>
		</div>
	)
}

export default Page
