import { Link } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { useSongsIndexRouteUtils } from './useSongsIndexRouteUtils'
export { loader } from './utils'

export default function SongsIndexRoute() {
  const { columns, navigate, params, songs, songCount } = useSongsIndexRouteUtils()

  if (!songs.length)
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

      <TableGeneric
        columns={columns}
        data={songs}
        onRowClick={event => navigate(`/bands/${params?.bandId}/songs/${event.id}/view`)}
        classNames="max-w-3xl"
      />
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
