import { Link, useSearchParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { Input } from '#app/components/ui/input.js'
import { Label } from '#app/components/ui/label.js'
import { useDebounce } from '#app/utils/misc.js'
import { useSongsIndexRouteUtils } from './useSongsIndexRouteUtils'
export { loader } from './utils'

export default function SongsIndexRoute() {
  const { columns, navigate, params, songs, songCount } = useSongsIndexRouteUtils()
  const [searchParams, setSearchParams] = useSearchParams()

  const handleSearchInputOnChange = useDebounce((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({ q: event.target.value })
  }, 400)

  if (!songs.length && !searchParams.get('q'))
    return (
      <>
        <EmptyStateGeneric
          iconNames={['rocket']}
          title="No Songs"
          messages={['Create a song to get started.', 'Or, upload a bunch of songs at once with a CSV!']}
          // primary
          linkTo="new"
          buttonTitle="Add Song"
          // secondary
          secondaryLinkTo="bulk-upload"
          secondaryButtonTitle="Bulk Upload"
          extra={
            <>
              {/* Anchor tag that downloads a csv from the /public dir */}

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
      </>
    )

  return (
    <div>
      <HeaderWithActions title={`Songs (${songCount})`}>
        <div className="flex gap-4">
          <Button asChild variant="secondary" size="sm">
            <Link to="new">Create</Link>
          </Button>

          <Button asChild variant="destructive" size="sm">
            <Link to="bulk-upload">Bulk Upload</Link>
          </Button>
        </div>
      </HeaderWithActions>

      <div className="flex flex-col gap-2 md:w-2/3">
        <Label htmlFor="q" className="">
          Song Search
        </Label>
        <div className="relative flex flex-wrap items-center gap-2">
          <Input
            type="q"
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
              setSearchParams({ q: '' })
              const input = document.getElementById('q') as HTMLInputElement
              input.value = ''
            }}
            className="absolute right-3 bg-transparent p-0 hover:bg-transparent"
          >
            <Icon name="cross-1" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TableGeneric
        columns={columns}
        data={songs}
        onRowClick={event => navigate(`/bands/${params?.bandId}/songs/${event.id}/view`)}
        classNames="max-w-3xl"
        searchQuery={searchParams.get('q') || ''}
      />
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
