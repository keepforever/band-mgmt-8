import { type Song } from '@prisma/client'

export type SongSelectorItem = Pick<Song, 'id' | 'title' | 'artist'> & {
  bandSongs?: Array<{
    vocalists?: Array<{
      user: {
        id: string
        name: string | null
        username: string
      }
    }>
  }>
}
