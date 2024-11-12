// 'use client'

// import { useState, useRef, useEffect } from 'react'
// import Login from './upload/components/Login/Login'
// import FileUploader from './fileUploader/page'
// import gsap from 'gsap'
// import Ripple from '../components/magicui/ripple'

// export default function HomePage() {
// 	const initBG = useRef(null)
// 	const animatedBG = useRef(null)
// 	const [isAuthenticated, setAuthenticated] = useState(false)
// 	const [status, setStatus] = useState('')

// 	return (
// 		<div className='relative flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl'>
// 			<p className='z-10 whitespace-pre-wrap text-center text-5xl font-medium tracking-tighter text-white'>
// 				Ripple
// 			</p>
// 			<Ripple />
// 			<div
// 				className='flex items-center justify-center h-screen w-screen opacity-100 z-40'
// 				ref={initBG}
// 			>
// 				{!isAuthenticated ? (
// 					<Login
// 						setAuthenticated={setAuthenticated}
// 						authenticated={isAuthenticated}
// 					/>
// 				) : (
// 					<div>
// 						<FileUploader authenticated={isAuthenticated} />
// 						<p>{status}</p>
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	)
// }
import FileUploader from './FileUploader/FileUploader'

export default function Home() {
	return (
		<div className='min-h-screen p-8'>
			<h1 className='text-2xl font-bold mb-4'>File Upload</h1>
			<FileUploader />
		</div>
	)
}
