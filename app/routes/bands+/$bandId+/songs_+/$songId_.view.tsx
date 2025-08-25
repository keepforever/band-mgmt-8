import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/node'
import { Form, Link, useFetcher, useLoaderData, useParams, useRevalidator, useSubmit } from '@remix-run/react'
import { useRef } from 'react'
import { LyricsViewer } from '#app/components/lyric-viewer.js'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn, useDoubleCheck } from '#app/utils/misc.js'
import { getSongLyric } from '#app/utils/song.server.js'
import { redirectWithToast } from '#app/utils/toast.server.js'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const songId = params.songId
  const bandId = params.bandId

  // If either userId or songId is missing, terminate the request with an error.
  invariantResponse(userId, 'Unauthorized access')
  invariantResponse(songId, 'Missing song ID')
  invariantResponse(bandId, 'Missing band ID')

  // Fetch song details using the provided songId.
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
      bandSongs: {
        where: {
          bandId: bandId,
        },
        select: {
          vocalists: {
            select: {
              id: true,
              vocalType: true,
              notes: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                },
              },
            },
          },
        },
      },
    },
  })

  // Ensure song was found; otherwise, terminate the request with an error.
  if (!song) throw new Error('Song not found')

  // Extract vocalists from the band song relationship
  const vocalists = song.bandSongs?.[0]?.vocalists || []

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

  const payload = { song, lyricHtml, pdfUrl, vocalists }

  return json(payload)
}

export default function SongDetails() {
  const submit = useSubmit()
  const params = useParams()
  const { song, lyricHtml, pdfUrl, vocalists } = useLoaderData<typeof loader>()
  const revalidator = useRevalidator()
  const lyricUploadRef = useRef<HTMLInputElement>(null)

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap justify-between gap-2 px-4 sm:px-0">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold leading-7">{song?.title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{song?.artist}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link relative="path" to="../edit" className="text-hyperlink hover:underline">
            <Button size="sm">Edit</Button>
          </Link>
          <DeleteSong />
        </div>
      </div>

      <div className="my-6 max-w-2xl border-t border-border">
        <dl className="divide-y divide-border">
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Artist</dt>
            <dd className="mt-1 text-sm leading-6 text-muted-foreground sm:col-span-2 sm:mt-0">{song?.artist}</dd>
          </div>

          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Title</dt>
            <dd className="mt-1 text-sm leading-6 text-muted-foreground sm:col-span-2 sm:mt-0">{song?.title}</dd>
          </div>

          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">YouTube URL</dt>
            <dd className="mt-1 text-sm leading-6 text-muted-foreground sm:col-span-2 sm:mt-0">
              <a
                href={String(song?.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-hyperlink hover:underline"
              >
                {song?.youtubeUrl}
              </a>
            </dd>
          </div>

          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Rating</dt>
            <dd className="mt-1 text-sm leading-6 text-muted-foreground sm:col-span-2 sm:mt-0">{song?.rating}</dd>
          </div>

          <div
            className={cn('px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0', {
              '!hidden': !song?.status,
            })}
          >
            <dt className="text-sm font-medium leading-5">Status</dt>
            <dd className="mt-1 text-sm leading-6 text-muted-foreground sm:col-span-2 sm:mt-0">{song?.status}</dd>
          </div>

          {/* Vocalists Section */}
          {vocalists && vocalists.length > 0 && (
            <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6">Vocalists</dt>
              <dd className="mt-1 text-sm leading-6 text-muted-foreground sm:col-span-2 sm:mt-0">
                <div className="space-y-3">
                  {vocalists.map(vocalist => {
                    // Color coding for different vocal types
                    const getVocalTypeStyle = (type: string) => {
                      switch (type.toLowerCase()) {
                        case 'lead':
                          return 'bg-green-50 text-green-700 ring-green-700/10 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-400/20'
                        case 'harmony':
                          return 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-400/20'
                        case 'backing':
                          return 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/20 dark:text-purple-400 dark:ring-purple-400/20'
                        case 'duet':
                          return 'bg-orange-50 text-orange-700 ring-orange-700/10 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-400/20'
                        default:
                          return 'bg-gray-50 text-gray-700 ring-gray-700/10 dark:bg-gray-900/20 dark:text-gray-400 dark:ring-gray-400/20'
                      }
                    }

                    return (
                      <div key={vocalist.id} className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {vocalist.user.name || vocalist.user.username}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getVocalTypeStyle(vocalist.vocalType || '')}`}
                          >
                            {vocalist.vocalType}
                          </span>
                        </div>
                        {vocalist.notes && (
                          <span className="ml-0 text-sm italic text-muted-foreground">{vocalist.notes}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {song?.lyrics?.id ? (
        <>
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-lg font-semibold leading-7">Lyrics</h2>

            <Form action={`/resources/song-lyric/${song?.lyrics?.id || ''}/delete`} method="POST" navigate={false}>
              <Button type="submit" variant="destructive" size="sm">
                <Icon name="trash">Delete</Icon>
              </Button>
            </Form>
          </div>

          {/* Lyrics */}

          {lyricHtml && <LyricsViewer lyricHtml={lyricHtml} />}

          {!lyricHtml && pdfUrl && <iframe title="pdf-viewer" src={pdfUrl} className="h-[600px] w-full border-none" />}
        </>
      ) : (
        <>
          <div className="fl mb-6 flex flex-wrap items-center gap-3">
            <input
              ref={lyricUploadRef}
              className="hidden"
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

                revalidator.revalidate()
              }}
            />
            <Button
              onClick={() => lyricUploadRef.current?.click()}
              type="button"
              variant="default"
              size="sm"
              className="w-40"
            >
              Upload Lyrics
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const songId = formData.get('songId') as string
  const bandId = params.bandId

  invariantResponse(songId, 'Song ID is required')
  invariantResponse(bandId, 'Band ID is required')

  await prisma.bandSong.deleteMany({ where: { songId } })
  await prisma.song.deleteMany({ where: { id: songId } })

  const redirectUrl = `/bands/${bandId}/songs`

  return redirectWithToast(redirectUrl, {
    type: 'success',
    title: 'Song Deleted',
    description: 'Song has been deleted successfully.',
  })
}

function DeleteSong() {
  const data = useLoaderData<typeof loader>()
  const dc = useDoubleCheck()
  const fetcher = useFetcher<typeof action>()

  return (
    <fetcher.Form method="POST">
      <StatusButton
        {...dc.getButtonProps({
          type: 'submit',
          name: 'songId',
          value: data.song.id,
        })}
        variant={dc.doubleCheck ? 'destructive' : 'destructive'}
        status={fetcher.state !== 'idle' ? 'pending' : (fetcher?.state ?? 'idle')}
        size="sm"
      >
        <Icon name="avatar">{dc.doubleCheck ? `Are you sure?` : `Delete`}</Icon>
      </StatusButton>
    </fetcher.Form>
  )
}
