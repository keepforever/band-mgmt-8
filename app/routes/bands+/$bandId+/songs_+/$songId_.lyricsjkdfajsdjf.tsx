import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useFetchers, useLoaderData, useParams, useRouteError } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#app/components/ui/tabs.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const songId = params.songId

  invariantResponse(userId, 'You must be logged in to create a song')
  invariantResponse(songId, 'Song is required')

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: {
      id: true,
      title: true,
      artist: true,
      status: true,
      rating: true,
      youtubeUrl: true,
      lyrics: { select: { id: true } },
    },
  })

  return json({ song })
}

export default function CreateSongRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const fetchers = useFetchers()

  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [lyricHtml, setLyricHtml] = useState<string>('')
  const [lyricMode, setLyricMode] = useState<'mode1' | 'mode2' | 'mode3'>('mode1')

  const isLyricUpdating = fetchers?.find(f => f.key === 'lyric')?.state === 'submitting'

  useEffect(() => {
    const fetchPdfUrl = async (id: string) => {
      const response = await fetch(`/resources/song-lyric/${id}`)
      const contentType = response.headers.get('Content-Type')
      if (contentType !== 'application/pdf') {
        const text = await response.text()
        setLyricHtml(text)
        return
      }
      setPdfUrl(response.url)
    }

    if (loaderData?.song?.lyrics?.id && !isLyricUpdating) {
      fetchPdfUrl(loaderData.song.lyrics.id)
    }
  }, [loaderData?.song?.lyrics?.id, isLyricUpdating])

  const renderLyric = () => {
    switch (lyricMode) {
      case 'mode1':
        return lyricHtml.replace(/\n/g, '')
      case 'mode2':
        return lyricHtml.split('\n').reduce((acc, line, index) => `${acc}${index % 2 === 0 ? '' : '\n'}${line}`, '')
      case 'mode3':
        return lyricHtml
      default:
        return ''
    }
  }

  return (
    <div className="mx-auto max-w-full">
      <h1 className="text-center text-2xl font-bold">{loaderData.song?.title}</h1>
      <Tabs className="w-[400px]">
        <TabsList>
          <TabsTrigger value="mode1" onClick={() => setLyricMode('mode1')}>
            Mode 1
          </TabsTrigger>
          <TabsTrigger value="mode2" onClick={() => setLyricMode('mode2')}>
            Mode 2
          </TabsTrigger>
          <TabsTrigger value="mode3" onClick={() => setLyricMode('mode3')}>
            Mode 3
          </TabsTrigger>
        </TabsList>
        <TabsContent value={lyricMode}>
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{renderLyric()}</pre>
        </TabsContent>
      </Tabs>
      {pdfUrl && <iframe title="pdf-viewer" src={pdfUrl} className="h-[600px] w-full border-none" />}
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const params = useParams()
  return (
    <div className="flex flex-col">
      <h1>{(error as any)?.data}</h1>
      <span className="break-words">{(error as any).message}</span>
      <Link to={`/bands/${params?.bandId}/songs`} className="text-xl font-bold text-blue-600 hover:underline">
        Song List
      </Link>
    </div>
  )
}
