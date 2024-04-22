import { useState } from 'react'

type Song = {
  id: string
  title: string
  artist: string
}

type Column = {
  order: number
  list: Song[]
}

export function useSetlist(initialColumns: Column[]) {
  const [columns, setColumns] = useState<Column[]>(initialColumns)

  const addColumn = () => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns]
      newColumns.splice(prevColumns.length - 1, 0, { order: prevColumns.length - 1, list: [] })
      return newColumns.map((col, index) => ({ ...col, order: index }))
    })
  }

  const removeColumn = (order: number) => {
    setColumns(prevColumns => {
      if (order === prevColumns.length - 1) {
        console.error('Cannot remove the bucket column.')
        return prevColumns
      }
      return prevColumns.filter(col => col.order !== order).map((col, index) => ({ ...col, order: index }))
    })
  }

  const addSongToColumn = (song: Song, columnOrder: number) => {
    setColumns(prevColumns =>
      prevColumns.map(column => (column.order === columnOrder ? { ...column, list: [...column.list, song] } : column)),
    )
  }

  const removeSongFromColumn = (songId: string, columnOrder: number) => {
    setColumns(prevColumns =>
      prevColumns.map(column =>
        column.order === columnOrder ? { ...column, list: column.list.filter(song => song.id !== songId) } : column,
      ),
    )
  }

  return { columns, setColumns, addColumn, removeColumn, addSongToColumn, removeSongFromColumn }
}
