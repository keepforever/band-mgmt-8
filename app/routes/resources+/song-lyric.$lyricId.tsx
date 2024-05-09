import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  unstable_parseMultipartFormData as parseMultipartFormData,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
} from '@remix-run/node'
import mammoth from 'mammoth'

import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

// TODO:BAC - consider using pdf-parse to extract text from PDFs,
// ChatGPT Demo: https://chat.openai.com/share/4451f601-1a99-4738-9a81-d81e0fb38f71
export async function loader({ params }: LoaderFunctionArgs) {
  invariantResponse(params.lyricId, 'Lyric ID is required', { status: 400 })

  const lyric = await prisma.songLyrics.findUnique({
    where: { id: params.lyricId },
    select: { contentType: true, blob: true },
  })

  invariantResponse(lyric, 'Not found', { status: 404 })

  if (lyric.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      // const resultHtml = await mammoth.convertToHtml({ buffer: Buffer.from(lyric.blob) })
      // const html = resultHtml.value // The extracted HTML

      /* Text is better because it preserves the placement of chords over lyrics and is easier to style */
      const resultText = await mammoth.extractRawText({ buffer: Buffer.from(lyric.blob) })
      const text = resultText.value // The raw text

      return new Response(text, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(text).toString(),
          'Content-Disposition': `inline; filename="${params.lyricId}"`,
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
        'Content-Disposition': `inline; filename="${params.lyricId}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)
  invariantResponse(userId, 'You must be logged in to create a song')

  const formData = await parseMultipartFormData(request, createMemoryUploadHandler({ maxPartSize: 5 * 1024 * 1024 }))

  const lyricsFile = formData.get('lyricsFile')
  invariantResponse(lyricsFile instanceof File, 'Lyrics file is required')

  // const bandId = formData.get('bandId')
  // invariantResponse(bandId, 'Band is required')

  const songId = formData.get('songId')
  invariantResponse(typeof songId === 'string', 'Song is required')

  const redirectPath = formData.get('redirect')
  invariantResponse(typeof redirectPath === 'string', 'Redirect is required')

  if (params.lyricId === 'new') {
    await prisma.songLyrics.create({
      data: {
        songId,
        contentType: lyricsFile.type,
        blob: Buffer.from(await lyricsFile.arrayBuffer()),
      },
    })
  } else {
    await prisma.songLyrics.update({
      where: { id: params.lyricId },
      data: {
        contentType: lyricsFile.type,
        blob: Buffer.from(await lyricsFile.arrayBuffer()),
      },
    })
  }

  // return redirect(redirectPath)
  return json({ foo: 'bar' })
}
