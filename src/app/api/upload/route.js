import { google } from 'googleapis'
import formidable from 'formidable'
import fs from 'fs/promises'
import { Readable } from 'stream'

export async function POST(req, res) {
	const form = formidable({ multiples: true })

	try {
		// Convert the req object to a readable stream
		const stream = new Readable()
		stream._read = () => {} // No-op
		stream.push(req.body)
		stream.push(null)

		const { fields, files } = await new Promise((resolve, reject) => {
			form.parse(stream, (err, fields, files) => {
				if (err) reject(err)
				else resolve({ fields, files })
			})
		})

		const file = files.file // Access the uploaded file

		// Setup Google API client
		const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
			process.env
		const oAuth2Client = new google.auth.OAuth2(
			GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET,
			GOOGLE_REDIRECT_URI
		)

		// Load and set OAuth2 credentials
		const tokens = {} // Replace with your token management logic
		oAuth2Client.setCredentials(tokens)

		const drive = google.drive({ version: 'v3', auth: oAuth2Client })

		const fileMetadata = {
			name: file.originalFilename,
		}
		const media = {
			mimeType: file.mimetype,
			body: fs.createReadStream(file.filepath),
		}

		const response = await drive.files.create({
			resource: fileMetadata,
			media: media,
			fields: 'id',
		})

		res.status(200).json({ fileId: response.data.id })
	} catch (error) {
		console.error('Error handling file upload:', error)
		res.status(500).json({ error: 'Error handling file upload' })
	}
}

export const runtime = 'nodejs' // Ensure this runs in a Node.js environment
