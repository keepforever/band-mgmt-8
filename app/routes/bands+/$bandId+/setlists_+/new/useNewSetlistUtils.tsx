import { type DropResult } from '@hello-pangea/dnd'
import { useFetcher, useLoaderData } from '@remix-run/react'
import debounce from 'lodash/debounce'
import { useState } from 'react'
import { MAX_SONGS_PER_SET } from '#app/constants/setlists.js'
import { type loader as songSearchLoader } from '#app/routes/resources+/song-search.tsx'
import { type loader } from './loader'

export default function useNewSetlistUtils() {
  const songsFetcher = useFetcher<typeof songSearchLoader>({ key: 'songSearch' })
  const { songs, events, bandId } = useLoaderData<typeof loader>()
  const [columns, setColumns] = useState<MySetlistType>([
    {
      order: 0,
      list: [],
    },
    // Bucket column
    {
      order: 1,
      list: songs.sort((a, b) => a.title.localeCompare(b.title)),
    },
  ])

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
        // Collect the songs from the column that is being removed
        const songsFromRemovedColumn = prevColumns.find(column => column.order === order)?.list || []

        // Filter out the column to be removed
        const filteredColumns = prevColumns.filter(column => column.order !== order)

        // Reassign order to maintain continuity except the last bucket
        const reorderedColumns = filteredColumns.map((col, index) => ({ ...col, order: index }))

        // Add the songs from the removed column back to the bucket
        reorderedColumns[reorderedColumns.length - 1].list = [
          ...reorderedColumns[reorderedColumns.length - 1].list,
          ...songsFromRemovedColumn,
        ]

        return reorderedColumns
      }
    })
  }

  const seedSets = (setCount: number, allSongs: Song[]) => {
    // Initialize new columns for the sets
    const newColumns: MySetlistType = []
    for (let i = 0; i < setCount; i++) {
      newColumns.push({
        order: i,
        list: [],
      })
    }

    // Evenly distribute songs across the new sets up to the maximum allowed per set
    let usedSongs = 0
    allSongs.forEach((song, index) => {
      const columnIndex = index % setCount
      if (newColumns[columnIndex].list.length < MAX_SONGS_PER_SET) {
        newColumns[columnIndex].list.push(song)
        usedSongs++
      }
    })

    // Retrieve the original bucket column
    const bucketColumn = columns[columns.length - 1]
    bucketColumn.order = setCount
    // Update the bucket column with any leftover songs
    bucketColumn.list = allSongs.slice(usedSongs)

    // Recalculate orders for new columns only
    const orderedNewColumns = newColumns.map((col, index) => ({
      ...col,
      order: index,
    }))

    // Concatenate the new columns with the updated bucket column to form the final columns array
    setColumns([...orderedNewColumns, bucketColumn])
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

  return {
    columns,
    addColumn,
    removeColumn,
    seedSets,
    onDragEnd,
    addSongToColumn,
    removeSongFromColumn,
    debouncedLoad,
    events,
    songs,
  }
}
