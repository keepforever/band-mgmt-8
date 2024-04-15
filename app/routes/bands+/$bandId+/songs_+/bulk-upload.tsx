import { Readable } from 'stream'
import { invariantResponse } from '@epic-web/invariant'
import {
  redirect,
  type ActionFunctionArgs,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, Link, useActionData, useParams, useRouteError } from '@remix-run/react'
import { parse } from 'csv-parse'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { MAX_SONG_COUNT } from '#app/constants/entity-allowances'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc'

type SongData = {
  title: string
  artist: string
}

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const bandId = params.bandId

  invariantResponse(userId, 'You must be logged in to create a song')
  invariantResponse(bandId, 'Band is required')

  const songCount = await prisma.song.count({
    where: {
      bandSongs: {
        every: {
          bandId,
        },
      },
    },
  })

  invariantResponse(songCount < MAX_SONG_COUNT, 'You have reached the maximum number of songs for this band')

  const formData = await parseMultipartFormData(request, createMemoryUploadHandler({ maxPartSize: 5 * 1024 * 1024 }))
  const songsCsvFile = formData.get('songsCsv')

  const songs: Array<SongData> = []

  if (songsCsvFile && songsCsvFile instanceof File) {
    const csvData = await songsCsvFile.arrayBuffer()
    const readable = new Readable()
    readable._read = () => {} // _read is required but you can noop it
    readable.push(Buffer.from(csvData))
    readable.push(null) // indicates end of stream

    readable
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (row: SongData) => {
        // console.log('\n', `row = `, row, '\n')
        console.log('\n', `row.artist = `, row.artist, '\n')
        console.log('\n', `row.title = `, row.title, '\n')
        songs.push(row)
      })
      .on('end', () => {
        console.log('CSV processing completed.')
      })
      .on('error', err => {
        console.error('Error while parsing CSV:', err)
      })
  }

  console.log('\n', `songs = `, songs, '\n')

  return redirect(`/bands/${bandId}/songs`)
}

export default function BulkUploadSongs() {
  const actionData = useActionData<typeof action>()

  console.group(`%cbulk-upload.tsx`, 'color: #ffffff; font-size: 13px; font-weight: bold;')
  console.log('\n', `actionData = `, actionData, '\n')
  console.groupEnd()

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">New Song Route</h1>
      <Form method="POST" encType="multipart/form-data" className="mt-6 flex flex-col gap-2">
        <input
          type="file"
          name="songsCsv"
          accept=".csv"
          className={cn(
            'rounded-md border border-gray-300 p-2',
            'focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-500',
            'hover:border-blue-500 hover:ring hover:ring-blue-500',
          )}
        />
        <StatusButton className="mt-4 w-full" status={'idle'} type="submit">
          Upload
        </StatusButton>
        <br />
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
