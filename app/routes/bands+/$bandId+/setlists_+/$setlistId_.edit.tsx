import { invariantResponse } from '@epic-web/invariant'
import { type DropResult, DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { type Song as SongModel } from '@prisma/client'
import { type SerializeFrom, json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useFetcher, useLoaderData } from '@remix-run/react'
import debounce from 'lodash/debounce'
import { useState } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Field, SelectField } from '#app/components/forms'
import { SongSelector } from '#app/components/song-selector.js'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import { type SongSelectorItem } from '#app/interfaces/song.js'
import { type loader as songSearchLoader } from '#app/routes/resources+/song-search.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn, formatDate } from '#app/utils/misc'

export type Song = SerializeFrom<Pick<SongModel, 'id' | 'title' | 'artist'>>

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)

  const songs = await prisma.song.findMany({
    select: {
      id: true,
      title: true,
      artist: true,
    },
    where: {
      bandSongs: {
        some: {
          bandId: params.bandId,
        },
      },
    },
  })

  const events = await prisma.event.findMany({
    where: {
      bands: {
        some: {
          bandId: params.bandId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      date: true,
    },
  })

  function shuffleArray(array: any) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  shuffleArray(songs)

  const setlist = await prisma.setlist.findUnique({
    where: {
      id: params.setlistId,
    },
    select: {
      name: true,
      events: {
        select: {
          id: true,
        },
      },
      sets: {
        select: {
          name: true,
          order: true,
          setSongs: {
            select: {
              order: true,
              song: {
                select: {
                  id: true,
                  title: true,
                  artist: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return json({ songs, events, bandId: params.bandId, setlist } as const)
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData()

  const userId = await requireUserId(request)
  const bandId = params.bandId
  const setlistId = params.setlistId

  invariantResponse(userId, 'You must be logged in to create a setlist')
  invariantResponse(bandId, 'Band ID is required')
  invariantResponse(setlistId, 'Setlist ID is required')

  const setlistName = formData.get('name')
  const eventId = formData.get('event')
  invariantResponse(typeof setlistName === 'string', 'Setlist name is required')
  invariantResponse(typeof eventId === 'string', 'Event ID is required')

  const setlist = await prisma.setlist.findUnique({
    where: {
      id: setlistId,
    },
    select: {
      sets: {
        select: {
          setlistId: true,
          id: true,
        },
      },
    },
  })

  const setsData = []
  for (const [key, value] of formData) {
    if (key.startsWith('set')) {
      const songs = JSON.parse(value as string) as Song[]
      setsData.push({
        name: `Set ${parseInt(key.replace('set', '')) + 1}`,
        songs,
      })
    }
  }

  const createSetsData = setsData.map((set, index) => ({
    name: set.name,
    order: index + 1,
    setSongs: {
      create: set.songs.map((song, songIndex) => ({
        songId: song.id,
        order: songIndex + 1,
      })),
    },
  }))

  await prisma.$transaction(async prisma => {
    const setIdArray = setlist?.sets.map(set => set.id)

    await prisma.setSong.deleteMany({
      where: {
        setId: {
          in: setIdArray,
        },
      },
    })

    await prisma.set.deleteMany({
      where: {
        setlistId: setlistId,
      },
    })

    await prisma.setlist.update({
      where: { id: setlistId },
      data: {
        name: setlistName,
        sets: {
          create: createSetsData,
        },
        ...(eventId && {
          events: {
            connect: {
              id: eventId,
            },
          },
        }),
      },
    })
  })

  return redirect(`/bands/${bandId}/setlists`)
}

export default function EditSetlistRoute() {
  const songsFetcher = useFetcher<typeof songSearchLoader>({ key: 'songSearch' })
  const { songs, events, bandId, setlist } = useLoaderData<typeof loader>()

  // Convert events for SelectField usage
  const eventOptions = [
    { label: !events.length ? 'All events have setlists' : 'Select an Event', value: '' },
    ...events.map(event => ({
      label: `${event.name}: ${formatDate(event.date)}`,
      value: event.id,
    })),
  ]

  const [columns, setColumns] = useState<MySetlistType>(() => {
    if (!setlist) return []

    const setlistPayload = setlist.sets
      .map(set => {
        return {
          order: set.order - 1,
          list: set.setSongs
            .map(setSong => ({
              id: setSong.song.id,
              title: setSong.song.title,
              artist: setSong.song.artist,
              order: setSong.order,
            }))
            .sort((a, b) => a.order - b.order),
        }
      })
      .sort((a, b) => a.order - b.order)

    const bucketColumn = {
      order: setlistPayload.length,
      // filter out any songs that are already in a set, sort songs alphabetically
      list: songs
        .filter(song => !setlistPayload.some(set => set.list.some(setSong => setSong.id === song.id)))
        .sort((a, b) => a.title.localeCompare(b.title)),
    }

    return [
      ...setlistPayload, //   // Bucket column
      bucketColumn,
    ]
  })

  type Song = (typeof songs)[0]

  type MySetlistType = {
    order: number
    list: Song[]
  }[]

  const debouncedLoad = debounce((value: string) => {
    songsFetcher.load(`/resources/song-search?q=${value}&bandId=${bandId}`)
  }, 500)

  // To add a column before the last 'bucket' column
  const addColumn = () => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns]
      // Insert new column before the last one (which is the bucket)
      newColumns.splice(prevColumns.length - 1, 0, { order: prevColumns.length - 1, list: [] as Song[] })
      // Update order for all columns, ensuring bucket remains the last
      return newColumns.map((col, index) => ({ ...col, order: index }))
    })
  }

  // To remove a column by order, ensuring the last 'bucket' column stays intact
  const removeColumn = (order: number) => {
    setColumns(prevColumns => {
      if (order === prevColumns.length - 1) {
        // Prevent removing the last column which is the bucket
        console.error('Cannot remove the bucket column.')
        return prevColumns
      } else {
        const filteredColumns = prevColumns.filter(column => column.order !== order)
        // Reassign order to maintain continuity except the last bucket
        return filteredColumns.map((col, index) => ({ ...col, order: index }))
      }
    })
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result

    // Do nothing if dropped outside a droppable area
    if (!destination) {
      console.error('\n', ` bail due to no destination`, '\n')
      return
    }
    // Unpack some variables to make the next steps clearer
    const sourceColumnIndex = columns.findIndex(col => String(col.order) === source.droppableId)
    const destinationColumnIndex = columns.findIndex(col => String(col.order) === destination.droppableId)

    // Protect against invalid indices
    if (sourceColumnIndex === -1 || destinationColumnIndex === -1) {
      console.error('\n', ` bail due to invalid indices`, '\n')
      return
    }

    const sourceColumn = columns[sourceColumnIndex]
    const destinationColumn = columns[destinationColumnIndex]
    const sourceItems = [...sourceColumn.list]
    const destinationItems = [...destinationColumn.list]

    // Moving within the same list
    if (source.droppableId === destination.droppableId) {
      const [removed] = sourceItems.splice(source.index, 1)
      sourceItems.splice(destination.index, 0, removed)
      // Update state
      setColumns(cols => {
        const payload = cols.map((col, index) => {
          if (index === sourceColumnIndex) {
            return { ...col, list: sourceItems }
          } else {
            return col
          }
        })

        return payload
      })
    } else {
      const [removed] = sourceItems.splice(source.index, 1)
      destinationItems.splice(destination.index, 0, removed)
      // Update state
      setColumns(cols => {
        const payload = cols.map((col, index) => {
          if (index === sourceColumnIndex) {
            return { ...col, list: sourceItems }
          } else if (index === destinationColumnIndex) {
            return { ...col, list: destinationItems }
          } else {
            return col
          }
        })
        return payload
      })
    }
    console.groupEnd()
  }

  const addSongToColumn = (song: Song, columnOrder: number) => {
    setColumns(currentColumns => {
      return currentColumns.map((column, index) => {
        // if column order matches, add song to column
        if (column.order === columnOrder) {
          const newList = [...column.list, song]
          return { ...column, list: newList }
        }
        // if last column, remove song from bucket
        if (index === currentColumns.length - 1) {
          const newList = column.list.filter(s => s.id !== song.id)
          return { ...column, list: newList }
        }
        return column
      })
    })
  }

  const removeSongFromColumn = (songId: string, columnOrder: number) => {
    setColumns(currentColumns => {
      return currentColumns.map(column => {
        if (column.order === columnOrder) {
          // Filter out the song by its ID
          const newList = column.list.filter(song => song?.id !== songId)
          return { ...column, list: newList }
        }
        // if last column, add song back to bucket
        if (column.order === currentColumns.length - 1) {
          const song = songs.find(s => s.id === songId)
          if (song) {
            const newList = [...column.list, song]
            return { ...column, list: newList }
          }
        }
        return column
      })
    })
  }

  return (
    <Form method="POST">
      <div className="flex justify-end gap-2">
        <Button type="submit" className="bg-green-600 text-gray-300" size="xs">
          Submit
        </Button>

        <Button type="button" size="xs" onClick={addColumn} variant="secondary">
          Add Set
        </Button>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Field
          className="w-full max-w-xl"
          labelProps={{ children: 'Setlist Name' }}
          inputProps={{
            type: 'text',
            autoFocus: true,
            name: 'name',
            required: true,
            defaultValue: setlist?.name,
          }}
        />

        <SelectField
          className="flex-1"
          selectClassName="w-full"
          label="Associate a setlist with an event"
          getOptionValue={(option: { label: string; value: string }) => option.value}
          getOptionLabel={(option: { label: string; value: string }) => option.label}
          labelHtmlFor="event" // Ensure this matches the ID used in getSelectProps if defined
          options={eventOptions}
          selectProps={{
            name: 'event',
            id: 'event',
            disabled: eventOptions.length === 1,
            defaultValue: setlist?.events[0]?.id,
          }}
        />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6">
          {/* Set Columns */}

          {columns.map(col => {
            const isLastColumn = col.order === columns.length - 1

            if (isLastColumn) {
              return (
                <Droppable droppableId={String(col.order)} key={String(col.order)}>
                  {provided => (
                    <div className="max-w-md flex-[1] border p-4 md:max-w-sm">
                      <h2 className="mb-3 text-xl underline">Bucket</h2>

                      <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2">
                        {/* Song List */}

                        {col.list.map((song: Song, index) => (
                          <Draggable draggableId={song?.id} index={index} key={song?.id}>
                            {provided => {
                              return (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between rounded-lg bg-gray-600 bg-opacity-40 p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <h2 className="font-bold">{song.title}</h2>
                                  </div>
                                </div>
                              )
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              )
            }

            return (
              <Droppable droppableId={String(col.order)} key={String(col.order)}>
                {provided => (
                  <div className="max-w-md flex-[1] border p-4 md:max-w-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl underline">{String(col.order + 1)}</h2>

                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className={cn('h-auto p-2 text-xs', {
                          hidden: columns.length === 1,
                        })}
                        onClick={() => removeColumn(col.order)}
                      >
                        <Icon name="trash" />
                      </Button>
                    </div>
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {/* Song List */}

                      {col.list.map((song: Song, index) => (
                        <Draggable draggableId={song?.id} index={index} key={song?.id}>
                          {provided => {
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-2 flex items-center justify-between rounded-lg bg-gray-600 bg-opacity-40 p-2"
                              >
                                <div className="flex items-center gap-2">
                                  <h2 className="font-bold">{song.title}</h2>
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  className={cn('h-auto p-1 text-xs')}
                                  onClick={() => removeSongFromColumn(song?.id, col.order)}
                                >
                                  <Icon name="trash" />
                                </Button>
                              </div>
                            )
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    <SongSelector
                      hideLabel
                      placeholder="Search for a song..."
                      onSongSelect={(song: SongSelectorItem) => addSongToColumn(song as Song, col.order)}
                      onInputValueChange={inputValue => debouncedLoad(inputValue)}
                    />

                    <input type="hidden" name={`set${col.order}`} value={JSON.stringify(col.list)} />
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>
    </Form>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
