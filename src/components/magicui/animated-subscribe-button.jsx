'use client'
import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export const AnimatedSubscribeButton = ({
	buttonColor,
	subscribeStatus,
	buttonTextColor,
	changeText,
	initialText,
	handleSubmit, // Added handleSubmit as a prop
}) => {
	const [isSubscribed, setIsSubscribed] = useState(subscribeStatus)

	const handleClick = (event) => {
		event.preventDefault()
		handleSubmit(event)
		// setIsSubscribed(!isSubscribed)
	}

	return (
		<AnimatePresence mode='wait'>
			{isSubscribed ? (
				<motion.button
					type='submit' // Added type='submit'
					className='relative flex w-[200px] items-center justify-center overflow-hidden rounded-md bg-white p-[10px] outline outline-1 outline-black'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={handleClick} // Added onClick handler
				>
					<motion.span
						key='action'
						className='relative block h-full w-full font-semibold'
						initial={{ y: -50 }}
						animate={{ y: 0 }}
						style={{ color: buttonColor }}
					>
						{changeText}
					</motion.span>
				</motion.button>
			) : (
				<motion.button
					type='submit' // Added type='submit'
					className='relative flex w-[200px] sm900:w-[120px] cursor-pointer items-center justify-center rounded-md border-none p-[10px] sm900:p-[9px]'
					style={{
						backgroundColor: buttonColor,
						color: buttonTextColor,
					}}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={handleClick} // Added onClick handler
				>
					<motion.span
						key='reaction'
						className='relative block font-semibold sm900:text-[18px] sm900:font-normal'
						initial={{ x: 0 }}
						exit={{ x: 50, transition: { duration: 0.1 } }}
					>
						{initialText}
					</motion.span>
				</motion.button>
			)}
		</AnimatePresence>
	)
}
