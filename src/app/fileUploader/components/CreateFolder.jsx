import React, { forwardRef, useEffect } from 'react'
import ShinyButton from '@/components/magicui/shiny-button'
const CreateFolder = forwardRef((props, ref) => {
	return (
		<div ref={ref} className='opacity-100 top-11 relative'>
			<input
				type='text'
				placeholder='Folder Name'
				className='text-black rounded-md border-2 border-gray-300 p-1 mx-2 box-border z-30 relative'
				value={props.folderName}
				onChange={(e) => props.setFolderName(e.target.value)}
			/>
			<ShinyButton
				text='Create Folder'
				className='p-2 z-1000'
				onClick={props.createFolder}
				ref={ref}
			/>
		</div>
	)
})

export default CreateFolder
