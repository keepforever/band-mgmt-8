import { Readable } from 'stream'
import { invariantResponse } from '@epic-web/invariant'
import {
  redirect,
  type ActionFunctionArgs,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from '@remix-run/node'
import { Form, Link, useParams, useRouteError } from '@remix-run/react'
import { parse } from 'csv-parse'
import Papa from 'papaparse'
import { useRef, useState } from 'react'
import { type Column, TableGeneric } from '#app/components/table-generic.js'
import { Button } from '#app/components/ui/button.js'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { MAX_SONG_COUNT } from '#app/constants/entity-allowances'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

type SongData = {
  title: string
  artist: string
  rating?: number
  status?: string
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
        // TODO:BAC - validate colum names against expected values

        // convert rating from string to number before pushing to songs array
        if (row.rating) row.rating = Number(row.rating)

        songs.push(row)
      })
      .on('end', async () => {
        try {
          await prisma.$transaction(
            songs.map(song =>
              prisma.song.create({
                data: {
                  artist: song.artist,
                  title: song.title,
                  rating: song?.rating || null,
                  status: song?.status || null,
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
              }),
            ),
          )
        } catch (error) {
          console.error('Error while adding songs and their associations to the database:', error)
        }
      })
      .on('error', err => {
        console.error('Error while parsing CSV:', err)
      })
  }

  return redirect(`/bands/${bandId}/songs`)
}

export default function BulkUploadSongs() {
  const fileUploadRef = useRef<HTMLInputElement>(null)
  const [previewData, setPreviewData] = useState<SongData[]>([])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        setPreviewData(results.data as SongData[])
      },
      error: error => {
        console.error('Error parsing CSV:', error)
      },
    })
  }

  const columns: Column<SongData>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
    },
    {
      title: 'Artist',
      dataIndex: 'artist',
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      render: value => value?.toString() || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
    },
  ]

  return (
    <div className="max-w-3xl">
      <h1 className="text-body-lg font-bold">Bulk Song Upload</h1>
      <Form method="POST" encType="multipart/form-data" className="mt-6 flex flex-col gap-2">
        <input
          ref={fileUploadRef}
          type="file"
          name="songsCsv"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" onClick={() => fileUploadRef.current?.click()} variant="outline">
            Choose CSV
          </Button>
          <StatusButton className="" status={'idle'} type="submit">
            Upload
          </StatusButton>
        </div>

        <h6 className="text-h6">
          You are about to upload {previewData.length} {previewData.length === 1 ? 'song' : 'songs'}
        </h6>

        <p className="text-body-sm">
          Click Upload to complete the process. You will be redirected to the song list page once the upload is
          complete.
        </p>

        {previewData.length > 0 && <TableGeneric columns={columns} data={previewData} />}

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

// TODO:BAC - maybe use this as basis for allowing user to edit the data before submitting
// {
//   previewData.length > 0 && (
//     <div className="mt-4">
//       <table className="w-full">
//         <thead>
//           <tr>
//             <th>Title</th>
//             <th>Artist</th>
//             <th>Rating</th>
//             <th>Status</th>
//           </tr>
//         </thead>
//         <tbody>
//           {previewData.map((song, index) => (
//             <tr key={index}>
//               <td>{song.title}</td>
//               <td>{song.artist}</td>
//               <td>{song.rating}</td>
//               <td>{song.status}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }
