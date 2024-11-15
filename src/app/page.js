'use client'

import { useState, useRef, useEffect } from 'react'
import Login from './upload/components/Login/Login'
import gsap from 'gsap'
import Ripple from '../components/magicui/ripple'
import ChunkUploader from './ChunkUploader/page'

export default function Home() {
	const initBG = useRef(null)
	const animatedBG = useRef(null)
	const [isAuthenticated, setAuthenticated] = useState(false)
	const [status, setStatus] = useState('')
	return (
		<div className='relative flex h-screen w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl'>
			<Ripple />
			<div
				className='flex items-center justify-center h-screen w-screen opacity-100 z-40'
				ref={initBG}
			>
				{!isAuthenticated ? (
					<Login
						setAuthenticated={setAuthenticated}
						authenticated={isAuthenticated}
					/>
				) : (
					<div>
						<ChunkUploader />
					</div>
				)}
			</div>
		</div>
	)
}
