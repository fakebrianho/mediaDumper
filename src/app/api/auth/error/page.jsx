// app/auth/error/page.jsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function ErrorPage() {
	const searchParams = useSearchParams()
	const error = searchParams.get('error')

	return (
		<div className='p-8'>
			<h1 className='text-2xl font-bold mb-4'>Authentication Error</h1>
			<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
				<p>
					<strong>Error: </strong> {error}
				</p>
				<p className='mt-2'>
					Please check your credentials and try again. If the problem
					persists, verify your Google Cloud Console configuration.
				</p>
			</div>
			<button
				onClick={() => (window.location.href = '/')}
				className='mt-4 bg-blue-500 text-white px-4 py-2 rounded'
			>
				Return Home
			</button>
		</div>
	)
}
