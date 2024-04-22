import Papa from 'papaparse'
import React from 'react'
import { Button } from './ui/button'

export const DownloadCSVButton: React.FC<{ data: string[][]; filename: string }> = ({ data, filename }) => {
  const handleDownload = () => {
    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload}>
      Download CSV
    </Button>
  )
}
