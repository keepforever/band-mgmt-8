import { useSearchParams } from '@remix-run/react'
import React from 'react'
import { Icon } from '#app/components/ui/icon.js'
import { cn } from '#app/utils/misc.js'

export type SortDirection = 'asc' | 'desc'

export type Column<T> = {
  title: string
  dataIndex: keyof T
  render?: (value: any, record: T) => React.ReactNode
  sortable?: boolean
  sortKey?: string // Optional custom sort key for the server
}

export type TableProps<T> = {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (record: T) => void
  searchQuery?: string
  classNames?: string
}

export function TableGeneric<T>({ columns, data, onRowClick, classNames, searchQuery }: TableProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentSortBy = searchParams.get('sortBy')
  const currentSortDirection = (searchParams.get('sortDirection') as SortDirection) || 'asc'

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    const sortKey = column.sortKey || String(column.dataIndex)
    const newDirection: SortDirection = currentSortBy === sortKey && currentSortDirection === 'asc' ? 'desc' : 'asc'

    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.set('sortBy', sortKey)
      newParams.set('sortDirection', newDirection)
      return newParams
    })
  }

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    const sortKey = column.sortKey || String(column.dataIndex)

    // Only show icon for the currently active sort column
    if (currentSortBy !== sortKey) {
      return null
    }

    return currentSortDirection === 'asc' ? (
      <Icon name="arrow-right" size="xs" className="ml-2 -rotate-90" />
    ) : (
      <Icon name="arrow-right" size="xs" className="ml-2 rotate-90" />
    )
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, record: T) => {
    if (event.key === 'Enter') {
      onRowClick?.(record)
    }
  }

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLTableCellElement>, column: Column<T>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleSort(column)
    }
  }

  return (
    <div className={cn('flow-root max-w-5xl', classNames)}>
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-border pl-3">
            <thead>
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className={cn(
                      'px-3 py-2 text-left text-sm font-semibold text-foreground',
                      column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                    )}
                    onClick={() => handleSort(column)}
                    onKeyDown={e => handleHeaderKeyDown(e, column)}
                    tabIndex={column.sortable ? 0 : undefined}
                  >
                    <div className="group flex items-center">
                      {column.title}
                      {getSortIcon(column)}
                      {/* Show hover indicator for sortable columns that aren't currently active */}
                      {column.sortable && currentSortBy !== (column.sortKey || String(column.dataIndex)) && (
                        <Icon
                          name="arrow-right"
                          size="xs"
                          className="ml-2 rotate-90 opacity-0 transition-opacity group-hover:opacity-30"
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {data.length ? (
                data.map((record, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn({
                      'cursor-pointer hover:bg-muted': !!onRowClick,
                    })}
                    tabIndex={0}
                    onClick={() => onRowClick?.(record)}
                    onKeyDown={e => handleKeyDown(e, record)}
                  >
                    {columns.map(({ dataIndex, render }, columnIndex) => (
                      <td key={columnIndex} className="whitespace-nowrap px-3 py-2 text-sm">
                        {render ? render(record[dataIndex], record) : String(record[dataIndex])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="bg-muted py-4 text-center font-semibold">
                    {searchQuery ? `No results found for "${searchQuery}"` : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
