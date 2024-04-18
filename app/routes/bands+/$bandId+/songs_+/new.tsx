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

  console.log('\n', `lyricsFile = `, lyricsFile, '\n')

  if (lyricsFile instanceof File && lyricsFile.size > 0) {
    console.log('\n', `hello create songLyrics `, '\n')
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
    // defaultValue: {
    //   artist: faker.person.firstName(),
    //   title: faker.company.name(),
    //   youtubeUrl: faker.internet.url(),
    //   rating: 2,
    //   status: faker.lorem.words(),
    // },
  })

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">New Song Route</h1>
      <Form method="POST" encType="multipart/form-data" {...getFormProps(form)} className="mt-6 flex flex-col gap-2">
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
        />
        <Field
          labelProps={{
            htmlFor: fields.title.id,
            children: 'Title',
          }}
          inputProps={getInputProps(fields.title, { type: 'text' })}
          errors={fields.title.errors}
        />
        <Field
          labelProps={{
            htmlFor: fields.youtubeUrl.id,
            children: 'YouTube URL',
          }}
          inputProps={getInputProps(fields.youtubeUrl, { type: 'text' })}
          errors={fields.youtubeUrl.errors}
        />
        <Field
          labelProps={{
            htmlFor: fields.rating.id,
            children: 'Rating',
          }}
          inputProps={getInputProps(fields.rating, { type: 'number' })}
          errors={fields.rating.errors}
        />
        <Field
          labelProps={{
            htmlFor: fields.status.id,
            children: 'Status',
          }}
          inputProps={getInputProps(fields.status, { type: 'text' })}
          errors={fields.status.errors}
        />
        <input
          type="file"
          name="lyricsFile"
          accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className={cn(
            'rounded-md border border-gray-300 p-2',
            'focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-500',
            'hover:border-blue-500 hover:ring hover:ring-blue-500',
          )}
        />
        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Submit Song
        </StatusButton>
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
