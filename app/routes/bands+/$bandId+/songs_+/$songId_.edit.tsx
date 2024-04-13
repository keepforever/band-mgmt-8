// CreateSongForm.tsx
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, Link, useActionData, useLoaderData, useParams, useRouteError } from '@remix-run/react'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const SongSchema = z.object({
  artist: z.string().min(1, 'Artist name is required'),
  title: z.string().min(1, 'Song title is required'),
  youtubeUrl: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.string().optional(),
})

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

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
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

  const { artist, title, youtubeUrl, rating, status } = submission.value

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

  return redirect(`/bands/${bandId}/songs`)
}

export default function CreateSongRoute() {
  const loaderData = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const params = useParams()
  const [form, fields] = useForm({
    id: 'create-song-form',
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

    if (loaderData?.song?.lyrics?.id) fetchPdfUrl(loaderData?.song?.lyrics?.id)
  }, [loaderData?.song?.lyrics?.id])

  return (
    <div className="container mx-auto max-w-full">
      <h1 className="text-center text-2xl font-bold">Song Id Route</h1>

      <Form method="POST" action="/resources/song-delete">
        <StatusButton
          type="submit"
          name="delete"
          value={loaderData.song?.id}
          variant="destructive"
          className="mt-4"
          status={form.status ?? 'idle'}
        >
          Delete
        </StatusButton>
        {/* Hiddent inputs to pass bandId  */}
        <input type="hidden" name="bandId" value={params?.bandId} />
      </Form>

      <Form method="POST" {...getFormProps(form)} className="mt-6 flex flex-col gap-2">
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
        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Update Song
        </StatusButton>
        <br />
        <ErrorList errors={form.errors} id={form.errorId} />
      </Form>

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
// /bands/${params?.bandId}/songs
// export function ErrorBoundary() {
//   return <GeneralErrorBoundary />
// }

// redeploy
