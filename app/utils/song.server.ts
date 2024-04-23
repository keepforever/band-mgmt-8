import mammoth from 'mammoth'

import { prisma } from '#app/utils/db.server.ts'

export async function getSongLyric(lyricId: string) {
  if (!lyricId) return null

  const lyric = await prisma.songLyrics.findUnique({
    where: { id: lyricId },
    select: { contentType: true, blob: true },
  })

  if (!lyric) return null

  if (lyric.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      /* Text is better because it preserves the placement of chords over lyrics and is easier to style */
      const resultText = await mammoth.extractRawText({ buffer: Buffer.from(lyric.blob) })
      const text = resultText.value // The raw text

      return new Response(text, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(text).toString(),
          'Content-Disposition': `inline; filename="${lyricId}"`,
        },
      })
    } catch (error) {
      console.error('Error processing DOCX file:', error)

      return new Response('Error processing file', { status: 500 })
    }
  } else {
    // Existing behavior for PDFs or any other file types
    return new Response(lyric.blob, {
      headers: {
        'Content-Type': lyric.contentType,
        'Content-Length': Buffer.byteLength(lyric.blob).toString(),
        'Content-Disposition': `inline; filename="${lyricId}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
}
