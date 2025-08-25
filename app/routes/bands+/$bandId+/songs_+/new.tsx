import { getFormProps, getInputProps, useForm } from '@conform-to/react'

import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  type LoaderFunctionArgs,
  json,
  redirect,
  type ActionFunctionArgs,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData, useParams, useRouteError } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.js'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { MAX_SONG_COUNT } from '#app/constants/entity-allowances'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserBelongToBand(request, params)
  const bandId = params.bandId

  invariantResponse(bandId, 'Band is required')

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
    bandMembers: bandMembers.map(member => member.user),
  })
}

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
  // TODO:BAC - add lyricsFile.  Follow similar pattern to app/routes/users+/$username_+/__note-editor.tsx line 34
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)

  const bandId = params.bandId

  invariantResponse(userId, 'You must be logged in to create a song')
  invariantResponse(bandId, 'Band is required')

  // check for max song count before creating a new song
  const songCount = await prisma.song.count({
    where: {
      bandSongs: {
        every: {
          bandId,
        },
      },
    },
  })

  // if this throws ErrorBoundary will catch
  invariantResponse(songCount < MAX_SONG_COUNT, 'You have reached the maximum number of songs for this band')

  // 5MB max size
  const formData = await parseMultipartFormData(request, createMemoryUploadHandler({ maxPartSize: 5 * 1024 * 1024 }))
  const submission = await parseWithZod(formData, { schema: SongSchema, async: true })

  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }

  if (songCount > MAX_SONG_COUNT) {
    return json(
      {
        result: submission.reply({
          formErrors: ['You have reached the maximum number of songs for this band'],
        }),
      },
      { status: 400 },
    )
  }

  const { artist, title, youtubeUrl, rating, status, vocalists } = submission.value

  const createdSong = await prisma.song.create({
    data: {
      artist,
      title,
      youtubeUrl,
      rating,
      status,
      bandSongs: {
        create: [
          {
            band: {
              connect: {
                id: bandId,
              },
            },
          },
        ],
      },
    },
  })

  // Handle vocalist assignments
  if (vocalists && vocalists.length > 0) {
    for (const vocalist of vocalists) {
      if (vocalist.userId && vocalist.vocalType) {
        await prisma.bandSongVocalist.create({
          data: {
            bandId: bandId,
            songId: createdSong.id,
            userId: vocalist.userId,
            vocalType: vocalist.vocalType,
            notes: vocalist.notes || null,
          },
        })
      }
    }
  }

  const lyricsFile = formData.get('lyricsFile')

  if (lyricsFile instanceof File && lyricsFile.size > 0) {
    await prisma.songLyrics.create({
      data: {
        songId: createdSong.id,
        contentType: lyricsFile.type,
        blob: Buffer.from(await lyricsFile.arrayBuffer()),
      },
    })
  }

  return redirect(`/bands/${bandId}/songs`)
}

export default function CreateSongRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  // Initialize vocalists state
  const [vocalists, setVocalists] = useState<
    Array<{
      userId: string
      vocalType: string
      notes: string
    }>
  >([])

  const [form, fields] = useForm({
    id: 'create-song-form',
    constraint: getZodConstraint(SongSchema),
    lastResult: actionData?.result,
    shouldRevalidate: 'onBlur',
  })

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

  return (
    <div className="max-w-2xl">
      <Form
        method="POST"
        encType="multipart/form-data"
        {...getFormProps(form)}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="col-span-2 flex flex-wrap-reverse items-center justify-between gap-2">
          <h1 className="text-body-lg font-bold">Create a Song</h1>
          <StatusButton className="col-span-2 mt-4" status={form.status ?? 'idle'} type="submit">
            Submit Song
          </StatusButton>
        </div>
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{ htmlFor: fields.artist.id, children: 'Artist' }}
          inputProps={{ ...getInputProps(fields.artist, { type: 'text' }), autoFocus: true }}
          errors={fields.artist.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{ htmlFor: fields.title.id, children: 'Title' }}
          inputProps={getInputProps(fields.title, { type: 'text' })}
          errors={fields.title.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{ htmlFor: fields.youtubeUrl.id, children: 'YouTube URL' }}
          inputProps={getInputProps(fields.youtubeUrl, { type: 'text' })}
          errors={fields.youtubeUrl.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{ htmlFor: fields.rating.id, children: 'Rating' }}
          inputProps={getInputProps(fields.rating, { type: 'number' })}
          errors={fields.rating.errors}
        />
        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{ htmlFor: fields.status.id, children: 'Status' }}
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

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{ htmlFor: 'lyricsFile', children: 'Choose a lyrics file' }}
          inputProps={{
            name: 'lyricsFile',
            accept: 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            type: 'file',
            placeholder: 'Choose a file',
            className: cn('bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/70'),
          }}
          errors={fields.status.errors}
        />
        <br />
        <ErrorList className="col-span-2" errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  const params = useParams()
  return (
    <div>
      <h1>{(error as any)?.data}</h1>
      <pre>{(error as any).message}</pre>
      <Link className="text-xl font-bold text-blue-600 hover:underline" to={`/bands/${params?.bandId}/songs`}>
        Song List
      </Link>
    </div>
  )
}
