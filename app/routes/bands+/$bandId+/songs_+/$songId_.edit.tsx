import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import {
  Form,
  Link,
  useActionData,
  useFetchers,
  useLoaderData,
  useLocation,
  useParams,
  useRouteError,
  useSubmit,
} from '@remix-run/react'
import { useState, useEffect, useRef } from 'react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.js'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const SongSchema = z.object({
  artist: z.string().min(1, 'Artist name is required'),
  title: z.string().min(1, 'Song title is required'),
  youtubeUrl: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.string().optional(),
  vocalists: z
    .array(
      z.object({
        userId: z.string(),
        vocalType: z.string(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
})

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const songId = params.songId
  const bandId = params.bandId

  invariantResponse(userId, 'You must be logged in to create a song')
  invariantResponse(songId, 'Song is required')
  invariantResponse(bandId, 'Band is required')

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
      bandSongs: {
        where: {
          bandId: bandId,
        },
        select: {
          vocalists: {
            select: {
              id: true,
              userId: true,
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

  // Get all band members for vocalist selection
  const bandMembers = await prisma.userBand.findMany({
    where: {
      bandId: bandId,
    },
    select: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  })

  return json({
    song,
    bandMembers: bandMembers.map(member => member.user),
  })
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const formData = await request.formData()
  const bandId = params.bandId
  const songId = params.songId

  invariantResponse(userId, 'You must be logged in to create a song')
  invariantResponse(bandId, 'Band is required')
  invariantResponse(songId, 'Song is required')

  const submission = parseWithZod(formData, { schema: SongSchema })

  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }

  const { artist, title, youtubeUrl, rating, status, vocalists } = submission.value

  // Update song details
  await prisma.song.update({
    where: {
      id: songId,
    },
    data: {
      artist,
      title,
      youtubeUrl,
      rating,
      status,
    },
  })

  // Handle vocalist assignments
  if (vocalists) {
    // First, remove all existing vocalist assignments for this band-song
    await prisma.bandSongVocalist.deleteMany({
      where: {
        bandId: bandId,
        songId: songId,
      },
    })

    // Then add new vocalist assignments
    for (const vocalist of vocalists) {
      if (vocalist.userId && vocalist.vocalType) {
        await prisma.bandSongVocalist.create({
          data: {
            bandId: bandId,
            songId: songId,
            userId: vocalist.userId,
            vocalType: vocalist.vocalType,
            notes: vocalist.notes || null,
          },
        })
      }
    }
  }

  return redirect(`/bands/${bandId}/songs`)
}

export default function CreateSongRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fetchers = useFetchers()
  const location = useLocation()
  const submit = useSubmit()
  const params = useParams()

  // Get current vocalists from the band song
  const currentVocalists = loaderData.song?.bandSongs?.[0]?.vocalists || []

  // Initialize vocalists state
  const [vocalists, setVocalists] = useState<
    Array<{
      userId: string
      vocalType: string
      notes: string
    }>
  >(
    currentVocalists.map(v => ({
      userId: v.userId,
      vocalType: v.vocalType || 'lead',
      notes: v.notes || '',
    })),
  )

  const [form, fields] = useForm({
    id: 'update-song-form',
    constraint: getZodConstraint(SongSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: SongSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
    defaultValue: {
      artist: loaderData.song?.artist,
      title: loaderData.song?.title,
      youtubeUrl: loaderData.song?.youtubeUrl,
      rating: loaderData.song?.rating,
      status: loaderData.song?.status,
    },
  })

  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [lyricHtml, setLyricHtml] = useState<string>('')

  const isLyricUpdating = fetchers?.find(f => f.key === 'lyric')?.state === 'submitting'

  // Helper functions for managing vocalists
  const addVocalist = () => {
    setVocalists(prev => [...prev, { userId: '', vocalType: 'lead', notes: '' }])
  }

  const removeVocalist = (index: number) => {
    setVocalists(prev => prev.filter((_, i) => i !== index))
  }

  const updateVocalist = (index: number, field: string, value: string) => {
    setVocalists(prev => prev.map((vocalist, i) => (i === index ? { ...vocalist, [field]: value } : vocalist)))
  }

  useEffect(() => {
    const fetchPdfUrl = async (id: string) => {
      const response = await fetch(`/resources/song-lyric/${id}`)
      const contentType = response.headers.get('Content-Type')

      if (contentType !== 'application/pdf') {
        //application/vnd.openxmlformats-officedocument.wordprocessingml.document
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

  return (
    <div className="max-w-3xl">
      <h1 className="text-body-lg font-bold">Edit Song</h1>

      <Form method="POST" action="/resources/song-delete" className="flex flex-wrap items-center justify-end gap-3">
        <StatusButton
          type="submit"
          name="delete"
          value={loaderData.song?.id}
          variant="destructive"
          status={form.status ?? 'idle'}
        >
          Delete
        </StatusButton>
        {/* Hiddent inputs to pass bandId  */}
        <input type="hidden" name="bandId" value={params?.bandId} />

        <StatusButton type="submit" form="update-song-form" className="" status={form.status ?? 'idle'}>
          Update Song
        </StatusButton>
      </Form>

      <ErrorList errors={form.errors} id={form.errorId} />

      <Form method="POST" {...getFormProps(form)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.artist.id,
            children: 'Artist',
          }}
          inputProps={{
            ...getInputProps(fields.artist, { type: 'text' }),
            autoFocus: true,
          }}
          errors={fields.artist.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.title.id,
            children: 'Title',
          }}
          inputProps={getInputProps(fields.title, { type: 'text' })}
          errors={fields.title.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.youtubeUrl.id,
            children: 'YouTube URL',
          }}
          inputProps={getInputProps(fields.youtubeUrl, { type: 'text' })}
          errors={fields.youtubeUrl.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.rating.id,
            children: 'Rating',
          }}
          inputProps={getInputProps(fields.rating, { type: 'number' })}
          errors={fields.rating.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.status.id,
            children: 'Status',
          }}
          inputProps={getInputProps(fields.status, { type: 'text' })}
          errors={fields.status.errors}
        />

        {/* Vocalists Section */}
        <div className="col-span-2">
          <h3 className="mb-3 text-lg font-medium">Vocalists</h3>
          {vocalists.map((vocalist, index) => (
            <div key={index} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-4">
              {/* Band Member Selection */}
              <div>
                <label className="mb-1 block text-sm font-medium">Singer</label>
                <select
                  name={`vocalists[${index}].userId`}
                  value={vocalist.userId}
                  onChange={e => updateVocalist(index, 'userId', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a band member</option>
                  {loaderData.bandMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vocal Type Selection */}
              <div>
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  name={`vocalists[${index}].vocalType`}
                  value={vocalist.vocalType}
                  onChange={e => updateVocalist(index, 'vocalType', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="lead">Lead</option>
                  <option value="harmony">Harmony</option>
                  <option value="backing">Backing</option>
                  <option value="duet">Duet</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <input
                  type="text"
                  name={`vocalists[${index}].notes`}
                  value={vocalist.notes}
                  onChange={e => updateVocalist(index, 'notes', e.target.value)}
                  placeholder="Optional notes"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Remove Button */}
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVocalist(index)}
                  className="w-full"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addVocalist} className="mt-2">
            + Add Vocalist
          </Button>
        </div>
      </Form>

      <input
        ref={fileInputRef}
        type="file"
        name="lyricsFile"
        className="hidden"
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
            action: `/resources/song-lyric/${loaderData.song?.lyrics?.id || 'new'}`,
            method: 'POST',
            encType: 'multipart/form-data',
            navigate: false,
            fetcherKey: 'lyric',
          })

          fileInputRef.current!.value = ''
        }}
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        type="button"
        variant="default"
        size="sm"
        className="col-span-2 rounded-md border p-2 text-body-sm sm:col-span-1"
      >
        Upload Lyrics
      </Button>

      {pdfUrl && <iframe title="pdf-viewer" src={pdfUrl} className="h-[600px] w-full border-none" />}

      {lyricHtml && (
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            lineHeight: '1.3',
          }}
        >
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
