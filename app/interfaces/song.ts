import { type Song } from '@prisma/client'

export type SongSelectorItem = Pick<Song, 'id' | 'title' | 'artist'>
