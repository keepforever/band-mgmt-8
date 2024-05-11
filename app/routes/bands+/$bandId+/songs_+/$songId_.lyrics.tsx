import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useParams, useRouteError } from '@remix-run/react'
import { LyricsViewer } from '#app/components/lyric-viewer.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { getSongLyric } from '#app/utils/song.server.js'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const songId = params.songId

  invariantResponse(userId, 'You must be logged in to create a song')
  invariantResponse(songId, 'Song is required')

  const song = await prisma.song.findUnique({
    where: {
      id: songId,
    },
    select: {
      id: true,
      title: true,
      artist: true,
      status: true,
      rating: true,
      youtubeUrl: true,
      lyrics: {
        select: {
          id: true,
        },
      },
    },
  })

  // Initialize variables to hold lyrics or PDF URL based on content type.
  let pdfUrl = ''
  let lyricHtml = ''

  // Fetch lyrics using the lyric ID from the song details.
  const songLyricResp = await getSongLyric(song?.lyrics?.id || '')
  const contentType = songLyricResp?.headers?.get('Content-Type')

  // Check the content type of the lyrics and assign values accordingly.
  if (contentType !== 'application/pdf') {
    const text = await songLyricResp?.text()
    lyricHtml = String(text)
  } else {
    pdfUrl = String(songLyricResp?.url)
  }

  const payload = { song, lyricHtml, pdfUrl }

  return json({ ...payload })
}

export default function CreateSongRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const { lyricHtml, pdfUrl } = loaderData

  return (
    <div className="mx-auto max-w-full">
      <h1 className="mb-3 text-body-lg font-bold">{loaderData.song?.title}</h1>

      <LyricsViewer lyricHtml={lyricHtml} />

      {pdfUrl && <iframe title="pdf-viewer" src={pdfUrl} className="h-[600px] w-full border-none" />}
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  const params = useParams()
  return (
    <div className="flex flex-col">
      <h1>{(error as any)?.data}</h1>
      <span className="break-words">{(error as any).message}</span>
      <Link className="text-xl font-bold text-blue-600 hover:underline" to={`/bands/${params?.bandId}/songs`}>
        Song List
      </Link>
    </div>
  )
}
