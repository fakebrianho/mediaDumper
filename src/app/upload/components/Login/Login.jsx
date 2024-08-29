import React from 'react'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { MagicCard } from '../../../../components/magicui/magic-card'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import { AnimatedSubscribeButton } from '../../../../components/magicui/animated-subscribe-button'
import gsap from 'gsap'

function Login(props) {
	const { theme, setTheme } = useTheme() // Destructure setTheme
	const [password, setPassword] = useState('')
	const cardRef = useRef(null)
	const bgRef = useRef(null)
	// const pwRef = useRef()

	const exitAnimation = () => {
		gsap.to(cardRef.current, {
			opacity: 0,
			duration: 1,
			ease: 'power1.easeInOut',
			onComplete: () => {
				props.setAuthenticated(true)
			},
		})
		gsap.to(bgRef.current, {
			autoAlpha: 0,
			duration: 1,
			ease: 'power1.easeInOut',
		})
		gsap.to(cardRef.current, {
			top: '2.75rem', // Animate top position to 0
			duration: 0.5,
			ease: 'power1.easeInOut',
		})
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		const body = {
			pw: password,
		}
		const res = await fetch('/api/password', {
			method: 'POST',
			body: JSON.stringify(body),
		})
		const data = await res.json()
		if (res.status === 200) {
			exitAnimation()
		} else {
			alert('Incorrect Password')
			setPassword('')
		}
	}

	useEffect(() => {
		gsap.to(cardRef.current, {
			opacity: 1,
			duration: 1.5,
			ease: 'power1.easeInOut',
		})
		gsap.to(cardRef.current, {
			top: 0, // Animate top position to 0
			duration: 1,
			ease: 'power1.easeInOut',
		})
	}, [setTheme])

	return (
		<div
			className='flex items-center justify-center h-screen w-screen bg-white opacity-100'
			ref={bgRef}
		>
			<div
				className={
					'flex h-[95%] w-[95%] flex-col gap-4 lg:h-[250px] lg:flex-row '
				}
			>
				<MagicCard
					className='cursor-pointer flex-col items-center justify-center shadow-2xl whitespace-nowrap text-4xl top-11 opacity-0'
					gradientColor={theme === 'dark' ? '#262626' : '#b1b1b1'}
					ref={cardRef}
				>
					<form
						onSubmit={handleSubmit}
						className='flex flex-row gap-4'
					>
						<input
							// ref={pwRef}
							type='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder='Enter Password'
							className='border-2 border-gray-300 rounded-md p-2 text-black sm900:w-[300px]'
						/>
						<div className='w-[100px]'>
							<AnimatedSubscribeButton
								buttonColor='#000000'
								buttonTextColor='#ffffff'
								subscribeStatus={false}
								handleSubmit={handleSubmit}
								initialText={
									<span className='group inline-flex items-center'>
										Submit{' '}
										<ChevronRightIcon className='ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1' />
									</span>
								}
								changeText={
									<span className='group inline-flex items-center'>
										<CheckIcon className='mr-2 h-4 w-4' />
										Submit{' '}
									</span>
								}
							/>
						</div>
					</form>
				</MagicCard>
			</div>
		</div>
	)
}

export default Login
