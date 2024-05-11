import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

type LyricTabsProps = {
  lyricHtml?: string
}

export const LyricsViewer: React.FC<LyricTabsProps> = ({ lyricHtml }) => {
  if (!lyricHtml) return null

  return (
    <Tabs defaultValue="mode2">
      <TabsList>
        <TabsTrigger value="mode1">Mode 1</TabsTrigger>
        <TabsTrigger value="mode2">Mode 2</TabsTrigger>
        <TabsTrigger value="mode3">Mode 3</TabsTrigger>
      </TabsList>
      <TabsContent value="mode1" className="pt-2">
        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{lyricHtml}</pre>
      </TabsContent>
      <TabsContent value="mode2" className="pt-2">
        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {lyricHtml.split('\n').reduce((acc, line, index) => `${acc}${index % 2 === 0 ? '' : '\n'}${line}`, '')}
        </pre>
      </TabsContent>
      <TabsContent value="mode3" className="pt-2">
        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{lyricHtml.replace(/\n/g, '')}</pre>
      </TabsContent>
    </Tabs>
  )
}
