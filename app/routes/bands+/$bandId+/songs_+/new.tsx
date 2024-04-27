import { getFormProps, getInputProps, useForm } from '@conform-to/react'

import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  redirect,
  type ActionFunctionArgs,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, Link, useActionData, useParams, useRouteError } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { MAX_SONG_COUNT } from '#app/constants/entity-allowances'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc'

const SongSchema = z.object({
  artist: z.string().min(1, 'Artist name is required'),
  title: z.string().min(1, 'Song title is required'),
  youtubeUrl: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.string().optional(),
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

  const { artist, title, youtubeUrl, rating, status } = submission.value

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
  const actionData = useActionData<typeof action>()
  const [form, fields] = useForm({
    id: 'create-song-form',
    constraint: getZodConstraint(SongSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: SongSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="max-w-2xl">
      <Form
        method="POST"
        encType="multipart/form-data"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        {...getFormProps(form)}
      >
        <div className="col-span-2 flex flex-wrap-reverse items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Create a Song</h1>

          <StatusButton className="col-span-2 mt-4" status={form.status ?? 'idle'} type="submit">
            Submit Song
          </StatusButton>
        </div>
        <Field
          labelProps={{
            htmlFor: fields.artist.id,
            children: 'Artist',
          }}
          inputProps={{
            ...getInputProps(fields.artist, { type: 'text' }),
            autoFocus: true,
          }}
          errors={fields.artist.errors}
          className="col-span-2 sm:col-span-1"
        />
        <Field
          labelProps={{
            htmlFor: fields.title.id,
            children: 'Title',
          }}
          inputProps={getInputProps(fields.title, { type: 'text' })}
          errors={fields.title.errors}
          className="col-span-2 sm:col-span-1"
        />
        <Field
          labelProps={{
            htmlFor: fields.youtubeUrl.id,
            children: 'YouTube URL',
          }}
          inputProps={getInputProps(fields.youtubeUrl, { type: 'text' })}
          errors={fields.youtubeUrl.errors}
          className="col-span-2 sm:col-span-1"
        />
        <Field
          labelProps={{
            htmlFor: fields.rating.id,
            children: 'Rating',
          }}
          inputProps={getInputProps(fields.rating, { type: 'number' })}
          errors={fields.rating.errors}
          className="col-span-2 sm:col-span-1"
        />
        <Field
          labelProps={{
            htmlFor: fields.status.id,
            children: 'Status',
          }}
          inputProps={getInputProps(fields.status, { type: 'text' })}
          errors={fields.status.errors}
          className="col-span-2 sm:col-span-1"
        />

        <Field
          labelProps={{
            htmlFor: fields.status.id,
            children: 'Choose a lyrics file',
          }}
          inputProps={{
            name: 'lyricsFile',
            accept: 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            type: 'file',
            placeholder: 'Choose a file',
            className: cn('bg-secondary text-secondary-foreground cursor-pointer hover:bg-secondary/70'),
          }}
          errors={fields.status.errors}
          className="col-span-2 sm:col-span-1"
        />

        <br />
        <ErrorList errors={form.errors} id={form.errorId} />
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
