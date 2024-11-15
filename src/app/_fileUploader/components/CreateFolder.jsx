import React, { forwardRef, useEffect } from 'react'
import ShinyButton from '@/components/magicui/shiny-button'
const CreateFolder = forwardRef((props, ref) => {
	return (
		<div
			ref={ref}
			className='opacity-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
		>
			<input
				type='text'
				placeholder='Folder Name'
				className='text-black rounded-md border-2 border-gray-300 p-1 mx-2 box-border z-30 relative'
				value={props.folderName}
				onChange={(e) => props.setFolderName(e.target.value)}
			/>
			<ShinyButton
				text={props.folderId ? 'Folder Created' : 'Create Folder'}
				className='p-2 z-1000'
				onClick={props.createFolder}
				folderStatus={props.folderStatus}
				ref={ref}
			/>
		</div>
	)
})

export default CreateFolder
