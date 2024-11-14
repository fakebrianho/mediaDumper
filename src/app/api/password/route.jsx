import { NextResponse } from 'next/server'

export async function POST(req) {
	const res = await req.json()
	const { pw } = res
	if (pw === process.env.PRIVATE_PASSWORD) {
		return NextResponse.json('', { status: 200 })
	} else {
		return NextResponse.json('', {
			status: 500,
		})
	}
}
