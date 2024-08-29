import { NextResponse } from 'next/server'

export async function POST(req) {
	const { PRIVATE_PASSWORD } = process.env

	const res = await req.json()
	const { pw } = res
	if (pw === PRIVATE_PASSWORD) {
		return NextResponse.json('', { status: 200 })
	} else {
		return NextResponse.json('', {
			status: 500,
		})
	}
}
