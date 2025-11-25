import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== TEST ROUTE HIT ===')
  return NextResponse.json({ message: 'Test route works!' })
}
