import { Link, useSearchParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#app/components/ui/dropdown-menu.tsx'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { Label } from '#app/components/ui/label.js'
import { useDebounce } from '#app/utils/misc.js'
import { useSongsIndexRouteUtils } from './useSongsIndexRouteUtils'
export { loader } from './songs-list-loader'

export default function SongsIndexRoute() {
  const { columns, navigate, params, songs, songCount } = useSongsIndexRouteUtils()
  const [searchParams, setSearchParams] = useSearchParams()

  const handleSearchInputOnChange = useDebounce((event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('q', event.target.value)
    setSearchParams(newSearchParams)
  }, 400)

  const handleStatusChange = (status: string) => {
    const newSearchParams = new URLSearchParams(searchParams)
    if (status) {
      newSearchParams.set('status', status)
    } else {
      newSearchParams.delete('status')
    }
    setSearchParams(newSearchParams)
  }

  const handleSortFieldChange = (sortBy: string) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('sortBy', sortBy)
    setSearchParams(newSearchParams)
  }

  const handleSortOrderChange = (sortOrder: string) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set('sortOrder', sortOrder)
    setSearchParams(newSearchParams)
  }

  if (!songs.length && !searchParams.get('q')) {
    return (
      <EmptyStateGeneric
        iconNames={['rocket']}
        title="No Songs"
        messages={['Create a song to get started.', 'Or, upload a bunch of songs at once with a CSV!']}
        linkTo="new"
        buttonTitle="Add Song"
        secondaryLinkTo="bulk-upload"
        secondaryButtonTitle="Bulk Upload"
        extra={
          <>
            <p className="mt-6">
              You can download a demo CSV file to see how to format your bulk upload file. Or, simply use the provided
              songs to get started and test out the app.
            </p>
            <Button asChild variant="secondary" size="sm">
              <a href="/bulk-song-upload-demo.csv" download>
                Download Demo Bulk Upload CSV
              </a>
            </Button>
          </>
        }
      />
    )
  }

  return (
    <div>
      <HeaderWithActions title={`Songs (${songCount})`}>
        <div className="flex gap-4">
          <Button asChild variant="secondary" size="sm">
            <Link to="new">Add New Song</Link>
          </Button>

          <Button asChild variant="destructive" size="sm">
            <Link to="bulk-upload">Bulk Upload</Link>
          </Button>
        </div>
      </HeaderWithActions>

      <div className="flex flex-col gap-2 md:w-2/3">
        <Label htmlFor="q">Song Search</Label>
        <div className="relative flex flex-wrap items-center gap-2">
          <Input
            type="text"
            name="q"
            id="q"
            defaultValue={searchParams.get('q') || ''}
            placeholder="Search"
            onChange={handleSearchInputOnChange}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const newSearchParams = new URLSearchParams(searchParams)
              newSearchParams.delete('q')
              setSearchParams(newSearchParams)
              const input = document.getElementById('q') as HTMLInputElement
              input.value = ''
            }}
            className="absolute right-3 bg-transparent p-0 hover:bg-transparent"
          >
            <Icon name="cross-1" className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-6">
          {/* Status Filter */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status Filter</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  {searchParams.get('status') || 'Select Status'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent sideOffset={8} alignOffset={-20} align="start">
                  <DropdownMenuItem onSelect={() => handleStatusChange('')}>All</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusChange('active')}>Active</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusChange('in-progress')}>In Progress</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusChange('ready')}>Ready</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusChange('proposed')}>Proposed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>

          {/* Sort By */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sortBy">Sort By</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  {searchParams.get('sortBy') || 'Title'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent sideOffset={8} alignOffset={-20} align="start">
                  <DropdownMenuItem onSelect={() => handleSortFieldChange('title')}>Title</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleSortFieldChange('artist')}>Artist</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleSortFieldChange('status')}>Status</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleSortFieldChange('rating')}>Rating</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">
                  {searchParams.get('sortOrder') === 'desc' ? 'Descending' : 'Ascending'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent sideOffset={8} alignOffset={-20} align="start">
                  <DropdownMenuItem onSelect={() => handleSortOrderChange('asc')}>Ascending</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleSortOrderChange('desc')}>Descending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <TableGeneric
          columns={columns}
          data={songs}
          onRowClick={event => navigate(`/bands/${params?.bandId}/songs/${event.id}/view`)}
          classNames="max-w-3xl"
          searchQuery={searchParams.get('q') || ''}
        />
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
