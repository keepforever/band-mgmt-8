import { useFetchers } from '@remix-run/react'
import { useCombobox } from 'downshift'
import { type SongSelectorItem } from '#app/interfaces/song.js'
import { cn } from '#app/utils/misc.js'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface SongSelectorProps {
  onSongSelect: (song: SongSelectorItem) => void
  placeholder?: string
  onInputValueChange?: (inputValue: string) => void
  hideLabel?: boolean
  usedSongIds?: Array<string>
}

export const SongSelector = ({
  onSongSelect,
  placeholder = '',
  onInputValueChange,
  hideLabel,
  usedSongIds,
}: SongSelectorProps) => {
  const fetchers = useFetchers()
  const songSearchFetcher = fetchers.find(fetcher => fetcher.key === 'songSearch')
  const fetchedSongs = songSearchFetcher?.data?.songs as SongSelectorItem[]

  const { isOpen, getMenuProps, getInputProps, getLabelProps, getItemProps, highlightedIndex, reset } = useCombobox({
    items: fetchedSongs || [],
    itemToString: item => (item ? item.title : ''),
    onInputValueChange: ({ inputValue }) => onInputValueChange?.(inputValue),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onSongSelect(selectedItem)
        reset()
      }
    },
  })

  return (
    <div className="flex flex-col gap-3">
      {!hideLabel && <Label {...getLabelProps()}>Search for a song</Label>}

      <Input
        {...getInputProps({
          autoFocus: true,
          placeholder,
        })}
      />

      <ul
        {...getMenuProps()}
        className={cn('mt-2 rounded border border-border', {
          hidden: !isOpen,
        })}
      >
        {isOpen &&
          fetchedSongs
            ?.filter(song => !usedSongIds?.includes(song.id) || usedSongIds?.length === 0)
            ?.map?.((song, index) => (
              <li
                key={song.id}
                {...getItemProps({
                  index,
                  item: song,
                })}
                className={cn('p-2', {
                  'cursor-pointer bg-accent-two text-accent-two-foreground hover:bg-destructive':
                    highlightedIndex === index,
                })}
              >
                {song.title}
              </li>
            ))}
      </ul>
    </div>
  )
}
