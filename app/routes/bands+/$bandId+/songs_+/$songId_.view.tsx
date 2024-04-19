// SongDetails.tsx
import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Form, Link, useLoaderData, useParams, useSubmit } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#app/components/ui/tabs.js'
import { useLyrics } from '#app/hooks/useLyrics.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.js'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const songId = params.songId

  // Ensure user is logged in and songId is provided
  if (!userId || !songId) throw new Error('Unauthorized access or missing song ID')

  const song = await prisma.song.findUnique({
    where: { id: songId },
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

  if (!song) throw new Error('Song not found')

  return json({ song })
}

export default function SongDetails() {
  const submit = useSubmit()
  const params = useParams()
  const { song } = useLoaderData<typeof loader>()
  const { lyricHtml, pdfUrl } = useLyrics(song?.lyrics?.id)

  return (
    <div>
      <div className="flex justify-between px-4 sm:px-0">
        <h3 className="text-lg font-semibold leading-7">
          {song?.title} by {song?.artist}
        </h3>

        <Link relative="path" to="../edit" className="text-blue-500 hover:underline">
          <Button size="sm">Edit</Button>
        </Link>
      </div>
      <div className="my-6 border-t border-white/10">
        <dl className="divide-y divide-white/10">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Artist</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">{song?.artist}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Title</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">{song?.title}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">YouTube URL</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">
              <a
                href={String(song?.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {song?.youtubeUrl}
              </a>
            </dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Rating</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">{song?.rating}</dd>
          </div>

          <div
            className={cn('px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0', {
              '!hidden': !song?.status,
            })}
          >
            <dt className="text-sm font-medium leading-5">Status</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-400 sm:col-span-2 sm:mt-0">{song?.status}</dd>
          </div>
        </dl>
      </div>

      {song?.lyrics?.id ? (
        <>
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-lg font-semibold leading-7">Lyrics</h2>
            {/* 
        
        
        */}
            <Form action={`/resources/song-lyric/${song?.lyrics?.id || ''}/delete`} method="POST" navigate={false}>
              <Button type="submit" variant="destructive" size="sm">
                <Icon name="trash">Delete</Icon>
              </Button>
            </Form>
          </div>

          {/* Lyrics */}

          {lyricHtml && (
            <Tabs defaultValue="mode2">
              <TabsList>
                <TabsTrigger value="mode1">Mode 1</TabsTrigger>
                <TabsTrigger value="mode2">Mode 2</TabsTrigger>
                <TabsTrigger value="mode3">Mode 3</TabsTrigger>
              </TabsList>
              <TabsContent value="mode1" className="pt-2">
                <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{lyricHtml}</pre>
              </TabsContent>
              <TabsContent value="mode2" className="pt-2">
                <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {lyricHtml
                    .split('\n')
                    .reduce((acc, line, index) => `${acc}${index % 2 === 0 ? '' : '\n'}${line}`, '')}
                </pre>
              </TabsContent>
              <TabsContent value="mode3" className="pt-2">
                <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                  {lyricHtml.replace(/\n/g, '')}
                </pre>
              </TabsContent>
            </Tabs>
          )}

          {!lyricHtml && pdfUrl && <iframe title="pdf-viewer" src={pdfUrl} className="h-[600px] w-full border-none" />}
        </>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-lg font-semibold leading-7">Add Lyrics</h2>

            <input
              type="file"
              name="lyricsFile"
              accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={async e => {
                const formData = new FormData()
                const file = e.target.files?.[0]

                if (file) {
                  formData.append('lyricsFile', file)
                  formData.append('songId', params?.songId || '')
                  formData.append('redirect', location.pathname)
                }

                submit(formData, {
                  action: `/resources/song-lyric/${song?.lyrics?.id || 'new'}`,
                  method: 'POST',
                  encType: 'multipart/form-data',
                  navigate: false,
                  fetcherKey: 'lyric',
                })
              }}
              className={cn(
                'rounded-md border border-gray-300 p-2',
                'focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-500',
                'hover:border-blue-500 hover:ring hover:ring-blue-500',
              )}
            />
          </div>
        </>
      )}
    </div>
  )
}
