import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCorpus } from '@/lib/services/corpus-retrieval'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const hookTypeFilter = searchParams.get('hookType') || undefined
    const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.3')
    const diversify = searchParams.get('diversify') !== 'false'

    // Retrieve relevant corpus
    const result = await retrieveRelevantCorpus(id, {
      limit,
      hookTypeFilter,
      minSimilarity,
      diversify,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Corpus retrieval error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    // Check for specific error types
    if (message.includes('Not found') || message.includes('not have an embedding')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
