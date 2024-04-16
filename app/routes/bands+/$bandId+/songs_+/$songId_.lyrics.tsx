import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useFetchers, useLoaderData, useParams, useRouteError } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#app/components/ui/tabs.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

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

  return json({
    song,
  })
}

export default function CreateSongRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const fetchers = useFetchers()

  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [lyricHtml, setLyricHtml] = useState<string>('')

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

    if (loaderData?.song?.lyrics?.id || (loaderData?.song?.lyrics?.id && !isLyricUpdating)) {
      fetchPdfUrl(loaderData?.song?.lyrics?.id)
    }
  }, [loaderData?.song?.lyrics?.id, isLyricUpdating])

  console.log('\n', `lyricHtml = `, lyricHtml, '\n')

  return (
    <div className="mx-auto max-w-full">
      <h1 className="text-center text-2xl font-bold">{loaderData.song?.title}</h1>

      <Tabs defaultValue="account" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Make changes to your account here.</TabsContent>
        <TabsContent value="password">Change your password here.</TabsContent>
      </Tabs>

      {pdfUrl && <iframe title="pdf-viewer" src={pdfUrl} className="h-[600px] w-full border-none" />}

      {lyricHtml && (
        <pre
          className="text-sm"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.3',
          }}
        >
          {/* mode 1 */}
          {lyricHtml.replace(/\n/g, '')}
          {/* mode 2 */}
          {lyricHtml.split('\n').reduce((acc, line, index) => {
            return acc + (index % 2 === 0 ? '' : '\n') + line
          }, '')}
          {/* mode 3 */}
          {lyricHtml}
        </pre>
      )}
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
