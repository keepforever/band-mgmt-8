import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Form } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Field } from '#app/components/forms'
import { SongSelector } from '#app/components/song-selector.js'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon'
import { type SongSelectorItem } from '#app/interfaces/song.js'
import { cn, formatDate } from '#app/utils/misc'
import useNewSetlistUtils from './useNewSetlistUtils'

export { action } from './action'
export { loader } from './loader'

export default function CreateSetlistRoute() {
  const {
    addColumn,
    addSongToColumn,
    columns,
    debouncedLoad,
    removeColumn,
    removeSongFromColumn,
    seedSets,
    onDragEnd,
    songs,
    events,
    defaultSetlistName,
  } = useNewSetlistUtils()

  type Song = (typeof songs)[0]

  return (
    <Form method="POST">
      {/* Action buttons */}

      <div className="flex justify-end gap-2">
        <Button type="submit" className="bg-green-600 text-gray-300" size="xs">
          Submit
        </Button>
        <Button size="xs" type="button" onClick={() => seedSets(3, songs)}>
          Seed Sets
        </Button>
        <Button type="button" size="xs" onClick={addColumn} variant="secondary">
          Add Set
        </Button>
      </div>

      {/* Setlist Name */}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Field
          className="w-full max-w-xl"
          labelProps={{ children: 'Setlist Name' }}
          inputProps={{
            type: 'text',
            autoFocus: true,
            name: 'name',
            required: true,
            defaultValue: defaultSetlistName ? `Copy of ${defaultSetlistName}` : '',
          }}
        />

        {/* Event Selector */}

        <select
          name="event"
          className={cn(
            'flex h-10 w-full max-w-xl rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
          )}
        >
          <option value="">Associate a setlist with an event</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {event.name}: {formatDate(event.date)}
            </option>
          ))}
        </select>
      </div>

      {/* Drag and Drop */}

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
