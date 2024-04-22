import { useCombobox } from 'downshift'
import { useState } from 'react'
import { Input } from '#app/components/ui/input.js'
import { Label } from '#app/components/ui/label.js'
import { cn } from '#app/utils/misc.js'

export const SongSelectorOld = () => {
  const songs = [
    {
      id: 1,
      title: 'Song 1',
      artist: 'Artist 1',
    },
    {
      id: 2,
      title: 'Song 2',
      artist: 'Artist 2',
    },
    {
      id: 3,
      title: 'Song 3',
      artist: 'Artist 3',
    },
    {
      id: 4,
      title: 'Song 4',
      artist: 'Artist 4',
    },
    {
      id: 5,
      title: 'Song 5',
      artist: 'Artist 5',
    },
  ]
  const [inputItems, setInputItems] = useState(songs)

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getLabelProps,
    getItemProps,
    highlightedIndex,
    reset /*, selectItem */,
  } = useCombobox({
    items: inputItems,
    itemToString: item => (item ? item.title : ''),
    onInputValueChange: ({ inputValue }) => {
      setInputItems(
        songs.filter(song => {
          return (
            song.title.toLowerCase().includes(inputValue.toLowerCase()) ||
            song.artist.toLowerCase().includes(inputValue.toLowerCase())
          )
        }),
      )
    },
    onSelectedItemChange: ({ selectedItem }) => {
      setInputItems([])
      console.info('\n', `selectedItem = `, selectedItem, '\n')
      reset()
    },
  })

  return (
    <div className="flex flex-col gap-3">
      <h2 className="mb-2 bg-foreground text-h2 font-semibold text-primary-foreground">Songs Downshift Example</h2>
      <Label {...getLabelProps()}>Search for a song</Label>

      <Input
        {...getInputProps({
          autoFocus: true,
          placeholder: 'Search for a song...',
        })}
      />

      {/* Combobox Menu */}

      <ul
        {...getMenuProps()}
        className={cn('mt-2 rounded border border-gray-300 bg-foreground p-2 text-background', {
          hidden: !isOpen,
        })}
      >
        {isOpen &&
          inputItems.map((song, index) => (
            <li
              key={`${song.id}`}
              {...getItemProps({
                index,
                item: song,
              })}
              className={cn('p-2', {
                'bg-accent-two text-accent-two-foreground': highlightedIndex === index,
              })}
            >
              {song.title}
            </li>
          ))}
      </ul>
    </div>
  )
}
