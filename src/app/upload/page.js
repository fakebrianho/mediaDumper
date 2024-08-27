'use client'

import { useState } from 'react'

export default function UploadPage() {
	const [file, setFile] = useState(null)

	const handleFileChange = (e) => {
		setFile(e.target.files[0])
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		const formData = new FormData()
		formData.append('file', file)

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		})

		if (response.ok) {
			alert('File uploaded successfully!')
		} else {
			alert('File upload failed!')
		}
	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<input type='file' onChange={handleFileChange} />
				<button type='submit'>Upload File</button>
			</form>
		</div>
	)
}
