import React from 'react'
import { cn } from '#app/utils/misc.js'

export type Column<T> = {
  title: string
  dataIndex: keyof T
  render?: (value: any, record: T) => React.ReactNode
  stopPropagation?: (value: any, record: T) => boolean
}

export type TableProps<T> = {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (record: T) => void
  classNames?: string
}
export function TableGeneric<T>({ columns, data, onRowClick, classNames }: TableProps<T>) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, record: T) => {
    if (event.key === 'Enter') {
      onRowClick?.(record)
    }
  }

  return (
    <div className={cn('flow-root max-w-5xl', classNames)}>
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-border pl-3">
            <thead>
              <tr>
                {columns.map(({ title }, index) => (
                  <th key={index} scope="col" className="px-3 py-2 text-left text-sm font-semibold text-foreground">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {data.map((record, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="cursor-pointer hover:bg-muted"
                  tabIndex={0}
                  onClick={() => onRowClick?.(record)}
                  onKeyDown={e => handleKeyDown(e, record)}
                >
                  {columns.map(({ dataIndex, render, stopPropagation }, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="whitespace-nowrap px-3 py-1.5 text-sm"
                      onClick={e => {
                        if (stopPropagation?.(record[dataIndex], record)) {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {render ? render(record[dataIndex], record) : String(record[dataIndex])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
