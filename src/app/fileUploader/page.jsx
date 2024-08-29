'use client'
import { useState, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import CreateFolder from './components/CreateFolder'
import ShineBorder from '@/components/magicui/shine-border'
import gsap from 'gsap'
import PulsatingButton from '@/components/ui/pulsating-button'
// import type { ConfettiRef } from '@/components/magicui/confetti'
import Confetti from '@/components/magicui/confetti'

const driveId = process.env.NEXT_PUBLIC_SHARED_DRIVE_ID

function page(props) {
	const [folderId, setFolderId] = useState(null)
	const [folderName, setFolderName] = useState(null)
	const [file, setFile] = useState(null)
	const [files, setFiles] = useState([])
	const folderRef = useRef()
	const containerRef = useRef()
	const uploadRef = useRef()
	const listRef = useRef()
	const uploadButtonRef = useRef()
	const confettiRef = useRef(null)

	const clearFiles = () => {
		setFiles([])
		setTimeout(() => {
			success()
			// confettiRef?.current.fire()
		}, 10)
	}

	const onDrop = (acceptedFiles) => {
		setFiles(acceptedFiles)
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

	const uploadFile = async () => {
		if (!files) return
		uploadButtonRef.current.innerHTML = 'Uploading'
		const formData = new FormData()
		formData.append('folderId', folderId)
		// console.log(files, 'preprocessed!')
		files.forEach((file, index) => {
			formData.append(`files[${index}]`, file)
		})
		formData.append('file', file)
		formData.append('driveId', driveId)
		// console.log(formData)
		const res = await fetch('/api/uploadFile', {
			method: 'POST',
			body: formData,
		})
		const data = await res.json()
		const link = data.fileLink.webViewLink
		if (res.status === 200) {
			// success()
			clearFiles()
			uploadButtonRef.current.innerHTML = 'Upload Files'
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
				className='flex items-center justify-center h-[40vh] w-[60vh]  opacity-0'
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
							style={{
								border: '2px dashed #cccccc',
								padding: '20px',
								textAlign: 'center',
								height: '60%',
								width: '90%',
								overflowY: 'auto', // Add this line
								maxHeight: '400px',
							}}
							// ref={uploadRef}
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
											// className='border-2'
											key={file.path}
										>
											{file.path}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</ShineBorder>
			</div>
		</div>
	)
}

export default page
