import { NextResponse } from 'next/server'

export async function GET() {
	return NextResponse.json({
		environmentCheck: {
			hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
			hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
			hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
			hasPrivateKeyId: !!process.env.GOOGLE_PRIVATE_KEY_ID,
			hasFolderId: !!process.env.GOOGLE_FOLDER_ID,
			// Add partial values for verification (be careful not to expose sensitive data)
			clientEmail:
				process.env.GOOGLE_CLIENT_EMAIL?.split('@')[1] || 'missing',
			projectId: process.env.GOOGLE_PROJECT_ID || 'missing',
			folderId:
				process.env.GOOGLE_FOLDER_ID?.substring(0, 4) || 'missing',
		},
	})
}
