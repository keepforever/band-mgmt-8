import { invariantResponse } from '@epic-web/invariant'
import { Combobox } from '@headlessui/react'
import { type DropResult, DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { type Song as SongModel } from '@prisma/client'
import { type SerializeFrom, json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useFetcher, useLoaderData, useSearchParams } from '@remix-run/react'
import debounce from 'lodash/debounce'
import { Fragment, useState } from 'react'
import { Field } from '#app/components/forms'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
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
      event: {
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

  // console.log('\n', `setlist = `, setlist, '\n')

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
        event: {
          connect: { id: eventId },
        },
        sets: {
          create: createSetsData,
        },
      },
    })
  })

  return redirect(`/bands/${bandId}/setlists`)
}

export default function EditSetlistRoute() {
  const { events, bandId, setlist } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()
  const addSongColumnOrder = searchParams.get('addSongColumnOrder')

  type MySetlistType = {
    order: number
    list: Song[]
  }[]

  const [columns, setColumns] = useState<MySetlistType>(() => {
    if (!setlist) return []

    return setlist.sets
      .map(set => {
        // console.log('\n', `set = `, set, '\n')
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
  })

  // To add a column
  const addColumn = () => {
    setColumns(prevColumns => [...prevColumns, { order: prevColumns.length, list: [] as Song[] }])
  }

  // To remove a column by order
  const removeColumn = (order: number) => {
    setColumns(prevColumns =>
      prevColumns.filter(column => column.order !== order).map((col, index) => ({ ...col, order: index })),
    )
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result
    // Do nothing if dropped outside a droppable area
    if (!destination) return
    // Unpack some variables to make the next steps clearer
    const sourceColumnIndex = columns.findIndex(col => String(col.order) === source.droppableId)
    const destinationColumnIndex = columns.findIndex(col => String(col.order) === destination.droppableId)
    // Protect against invalid indices
    if (sourceColumnIndex === -1 || destinationColumnIndex === -1) return

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
      // Moving from one list to another
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
  }

  const addSongToColumn = (song: Song, columnOrder: number) => {
    setColumns(currentColumns => {
      return currentColumns.map(column => {
        if (column.order === columnOrder) {
          // Clone the column's list and add the new song
          const newList = [...column.list, song]
          return { ...column, list: newList }
        }
        return column
      })
    })
  }

  const songIsInAnySetlist = (songId?: string) => {
    return columns.some(column => column.list.some(song => song?.id === songId))
  }

  const removeSongFromColumn = (songId: string, columnOrder: number) => {
    setColumns(currentColumns => {
      return currentColumns.map(column => {
        if (column.order === columnOrder) {
          // Filter out the song by its ID
          const newList = column.list.filter(song => song?.id !== songId)
          return { ...column, list: newList }
        }
        return column
      })
    })
  }

  const songsFetcher = useFetcher<typeof songSearchLoader>()

  const debouncedLoad = debounce((value: string) => {
    songsFetcher.load(`/resources/song-search?q=${value}&bandId=${bandId}`)
  }, 500)

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

        <select
          name="event"
          defaultValue={setlist?.event?.id}
          className={cn(
            'flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
          )}
        >
          <option value="">Select a Venue</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.name}: {formatDate(event.date)}
            </option>
          ))}
        </select>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6">
          {/* Set Columns */}

          {columns.map(col => {
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

                    {addSongColumnOrder === String(col.order) && (
                      <Combobox
                        value={null}
                        onChange={value => {
                          const targetSong = songsFetcher?.data?.songs.find(song => song?.id === value)
                          addSongToColumn(targetSong as Song, col.order)
                          const params = new URLSearchParams()
                          setSearchParams(params, {
                            preventScrollReset: true,
                          })
                        }}
                      >
                        <Combobox.Input
                          autoFocus
                          placeholder="Search for a song..."
                          onChange={event => debouncedLoad(event.target.value)}
                          className={cn(
                            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
                            'mt-4',
                          )}
                          onBlur={() => setSearchParams({})}
                        />
                        <Combobox.Options className="h-96">
                          {songsFetcher?.data?.songs.map(song => {
                            if (songIsInAnySetlist(song?.id || '')) return null

                            return (
                              /* Use the `active` state to conditionally style the active option. */
                              /* Use the `selected` state to conditionally style the selected option. */
                              <Combobox.Option key={song?.id} value={song?.id} as={Fragment}>
                                {({ active, selected }) => (
                                  <li
                                    className={cn('px-4 py-2', {
                                      'bg-blue-500 text-white': active,
                                      'bg-background text-foreground': !active,
                                    })}
                                  >
                                    {selected && <span>✓</span>}
                                    {song?.title}
                                  </li>
                                )}
                              </Combobox.Option>
                            )
                          })}
                        </Combobox.Options>
                      </Combobox>
                    )}

                    {/* Button to set query param to col.order */}
                    <Button
                      className={cn('mt-3 w-full', {
                        hidden: addSongColumnOrder === String(col.order),
                      })}
                      type="button"
                      size="sm"
                      onClick={() => {
                        setSearchParams({
                          addSongColumnOrder: String(col.order),
                        })
                      }}
                    >
                      Add Song
                    </Button>

                    <input type="hidden" name={`set${col.order}`} value={JSON.stringify(col.list)} />
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      <input type="hidden" name="event" value={events[Math.floor(Math.random() * events.length)]?.id} />
    </Form>
  )
}

/* 
Sequences of operations to delete a setlist:
1. setsong
2. set
3. bandsetlist
4. setlist
    
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

  await prisma.bandSetlist.deleteMany({
    where: {
      setlistId: setlistId,
    },
  })

  await prisma.setlist.delete({
    where: {
      id: setlistId,
    },
  })

*/