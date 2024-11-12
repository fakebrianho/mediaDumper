// app/test/page.jsx
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function testAuth() {
	const { data: session, status } = useSession()

	if (status === 'loading') {
		return <div>Loading...</div>
	}

	return (
		<div className='p-8'>
			<h1 className='text-2xl mb-4'>OAuth Test Page</h1>

			{session ? (
				<div className='space-y-4'>
					<div className='p-4 bg-green-100 rounded'>
						<p className='text-green-700'>
							✓ Successfully signed in
						</p>
						<p>Email: {session.user?.email}</p>
					</div>

					<div className='p-4 bg-gray-100 rounded'>
						<h2 className='font-bold mb-2'>Session Data:</h2>
						<pre className='whitespace-pre-wrap overflow-auto'>
							{JSON.stringify(session, null, 2)}
						</pre>
					</div>

					<button
						onClick={() => signOut()}
						className='bg-red-500 text-white px-4 py-2 rounded'
					>
						Sign Out
					</button>
				</div>
			) : (
				<div className='space-y-4'>
					<div className='p-4 bg-yellow-100 rounded'>
						<p className='text-yellow-700'>Not signed in</p>
					</div>

					<button
						onClick={() => signIn('google')}
						className='bg-blue-500 text-white px-4 py-2 rounded'
					>
						Sign In with Google
					</button>
				</div>
			)}
		</div>
	)
}
