import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Form } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Field, SelectField } from '#app/components/forms'
import { SongSelector } from '#app/components/song-selector.js'
import { Button } from '#app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#app/components/ui/dropdown-menu.js'
import { Icon } from '#app/components/ui/icon'
import { type SongSelectorItem } from '#app/interfaces/song.js'
import { cn } from '#app/utils/misc'
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
    eventOptions,
    defaultSetlistName,
  } = useNewSetlistUtils()

  type Song = (typeof songs)[0]

  const usedSongIds: Array<string> = columns.slice(0, -1).flatMap(col => col.list.map(song => song.id))

  return (
    <Form method="POST">
      {/* Action buttons */}

      <div className="mb-4 flex items-center justify-end gap-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="default" type="button">
              Seed Sets
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent sideOffset={5} alignOffset={0} align="start">
              <DropdownMenuItem onSelect={() => seedSets(1, songs)} asChild>
                <Button type="button" variant="ghost">
                  Seed One Set
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => seedSets(2, songs)} asChild>
                <Button type="button" variant="ghost">
                  Seed Two Sets
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => seedSets(3, songs)} asChild>
                <Button type="button" variant="ghost">
                  Seed Three Sets
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenu>

        <Button type="button" onClick={addColumn} variant="secondary">
          Add Set
        </Button>

        <Button type="submit" className="bg-status-success text-status-success-foreground">
          Submit
        </Button>
      </div>

      {/* Setlist Name */}

      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <Field
          className="md:col-span-1"
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

        <SelectField
          className="md:col-span-1"
          selectClassName="w-full"
          label="Associate a setlist with an event"
          getOptionValue={(option: { label: string; value: string }) => option.value}
          getOptionLabel={(option: { label: string; value: string }) => option.label}
          labelHtmlFor="event" // Ensure this matches the ID used in getSelectProps if defined
          options={eventOptions}
          selectProps={{ name: 'event', id: 'event', disabled: eventOptions.length === 1 }}
        />
      </div>

      {/* Drag and Drop */}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-wrap gap-2">
          {/* Set Columns */}

          {columns.map(col => {
            const isLastColumn = col.order === columns.length - 1

            if (isLastColumn) {
              return (
                <Droppable droppableId={String(col.order)} key={String(col.order)}>
                  {provided => (
                    <div className="max-w-md flex-[1] border p-2 md:max-w-sm">
                      <h2 className="mb-3e txt-xl underline">Bucket</h2>

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
                                  className="flex items-center justify-between rounded-lg bg-secondary bg-opacity-40 p-2"
                                >
                                  <div className="flex flex-wrap items-center gap-1">
                                    <h5 className="text-body-xs font-bold text-secondary-foreground">{song.title}</h5>
                                    <span className="text-body-2xs text-muted-foreground">{song.artist}</span>
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
                  <div className="max-w-md flex-[1] border p-2 md:max-w-sm">
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
                                className="mb-2 flex items-center justify-between rounded-lg bg-secondary bg-opacity-40 p-2"
                              >
                                <div className="flex flex-wrap items-center gap-1">
                                  <h5 className="text-body-xs font-bold text-secondary-foreground">{song.title}</h5>
                                  <span className="text-body-2xs text-muted-foreground">{song.artist}</span>
                                  {/* <span>{song.id.slice(-4)}</span> */}
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
                      usedSongIds={usedSongIds}
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
