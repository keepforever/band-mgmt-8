import { useState, useEffect } from 'react'

type UseLyricsReturn = {
  pdfUrl: string
  lyricHtml: string
  //   isLyricUpdating: boolean
}

export function useLyrics(lyricId: string | undefined /* , isLyricUpdating: boolean */): UseLyricsReturn {
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [lyricHtml, setLyricHtml] = useState<string>('')

  useEffect(() => {
    const fetchPdfUrl = async (id: string) => {
      const response = await fetch(`/resources/song-lyric/${id}`)
      const contentType = response.headers.get('Content-Type')

      if (contentType !== 'application/pdf') {
        const text = await response.text()
        setLyricHtml(text)
        return
      }

      setPdfUrl(response.url)
    }

    // if (lyricId && !isLyricUpdating) {
    if (lyricId) {
      fetchPdfUrl(lyricId)
    }
    //   }, [lyricId, isLyricUpdating])
  }, [lyricId])

  //   return { pdfUrl, lyricHtml, isLyricUpdating }
  return { pdfUrl, lyricHtml }
}
