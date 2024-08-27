'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
	const [password, setPassword] = useState('')
	const router = useRouter()

	const handleSubmit = (e) => {
		e.preventDefault()
		if (password === process.env.NEXT_PUBLIC_APP_PASSWORD) {
			router.push('/upload')
		} else {
			alert('Incorrect Password')
		}
	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<input
					type='password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder='Enter Password'
				/>
				<button type='submit'>Submit</button>
			</form>
		</div>
	)
}
