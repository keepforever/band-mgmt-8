import { Link } from '@remix-run/react'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { useSongsIndexRouteUtils } from './useSongsIndexRouteUtils'
export { loader } from './utils'

export default function SongsIndexRoute() {
  const { columns, navigate, params, songs, songCount } = useSongsIndexRouteUtils()

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
      />
    </div>
  )
}
