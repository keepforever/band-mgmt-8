import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { VocalistBadge } from '#app/components/vocalist-badge.tsx'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'

type ProposedSong = {
  id: string
  title: string
  artist: string
  status: string | null
  rating: number | null
  youtubeUrl: string | null
  lyricId: string
  setSongCount: number
  vocalists: Array<{
    vocalType: string | null
    notes: string | null
    user: {
      id: string
      name: string | null
      username: string
    }
  }>
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)

  const bandId = params.bandId

  const proposedSongs = await prisma.bandSong.findMany({
    where: {
      bandId,
      song: {
        status: 'proposed',
      },
    },
    select: {
      song: {
        select: {
          id: true,
          title: true,
          artist: true,
          status: true,
          rating: true,
          youtubeUrl: true,
          lyrics: {
            select: {
              id: true,
            },
          },
          _count: {
            select: {
              SetSong: true,
            },
          },
        },
      },
      vocalists: {
        select: {
          vocalType: true,
          notes: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      },
    },
    orderBy: {
      song: {
        title: 'asc',
      },
    },
  })

  return json({
    proposedSongs: proposedSongs.map(song => ({
      ...song.song,
      lyricId: song?.song?.lyrics?.id || '',
      setSongCount: song.song._count.SetSong,
      vocalists: song.vocalists,
    })),
    proposedSongCount: proposedSongs.length,
  })
}

export default function ThunderdomeIndex() {
  const { proposedSongs, proposedSongCount } = useLoaderData<typeof loader>()
  const params = useParams()

  if (!proposedSongs.length) {
    return (
      <EmptyStateGeneric
        iconNames={['rocket']}
        title="No Proposed Songs"
        messages={['No songs are currently proposed.', 'Propose some songs to review them here.']}
        linkTo={`/bands/${params.bandId}/songs/new`}
        buttonTitle="Propose a Song"
      />
    )
  }

  const columns: Column<ProposedSong>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>

          {!!record.lyricId && (
            <Link
              to={`/bands/${params?.bandId}/songs/${record.id}/lyrics`}
              className="flex items-center text-muted-foreground"
              onClick={e => e.stopPropagation()}
            >
              <Icon name="file-text" className="h-5 w-5 text-hyperlink hover:text-hyperlink-hover" />
            </Link>
          )}

          <a
            href={
              record.youtubeUrl ||
              `https://www.google.com/search?q=${encodeURIComponent(`${record.title} by ${record.artist}`)}+youtube+video`
            }
            target="_blank"
            rel="noreferrer"
            className="flex items-center"
            title="Search YouTube for Song Video"
            onClick={e => e.stopPropagation()}
          >
            <Icon name="youtube" className="h-6 w-6 stroke-hyperlink text-background hover:stroke-hyperlink-hover" />
          </a>
        </div>
      ),
    },
    {
      title: 'Artist',
      dataIndex: 'artist',
      sortable: true,
    },
    {
      title: 'Vocalists',
      dataIndex: 'vocalists',
      sortable: true,
      sortKey: 'vocalist',
      render: (value: ProposedSong['vocalists']) => (
        <div className="space-y-1">
          {value?.map((vocalist, vIndex) => (
            <div key={`${vocalist.user.id}-${vIndex}`} className="flex items-center gap-2">
              <VocalistBadge user={vocalist.user} compact />
              {vocalist.vocalType && <span className="text-xs text-muted-foreground">({vocalist.vocalType})</span>}
            </div>
          ))}
          {!value?.length && <span className="text-sm text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'vocalists',
      render: (value: ProposedSong['vocalists']) => (
        <div className="max-w-xs">
          {value
            ?.filter(v => v.notes)
            .map((vocalist, vIndex) => (
              <div key={`${vocalist.user.id}-notes-${vIndex}`} className="mb-1 text-xs text-muted-foreground">
                <span className="font-medium">{vocalist.user.name || vocalist.user.username}:</span>{' '}
                <span className="italic">"{vocalist.notes}"</span>
              </div>
            ))}
          {!value?.some(v => v.notes) && <span className="text-sm text-muted-foreground">-</span>}
        </div>
      ),
    },
    {
      title: 'Used',
      dataIndex: 'setSongCount',
      sortable: true,
      render: value => (
        <div
          className="flex items-center gap-2"
          title={`Indicates that this song is used in ${value} different Set Lists`}
        >
          {value || 0}
        </div>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      sortable: true,
      render: value => <span>{value ? `${value}/5` : 'Unrated'}</span>,
    },
    {
      title: 'Actions',
      dataIndex: 'id',
      render: (value, record) => (
        <div className="flex flex-wrap gap-1">
          <Button asChild size="sm" className="h-7 text-xs">
            <Link to={`/bands/${params.bandId}/songs/${record.id}/edit`} onClick={e => e.stopPropagation()}>
              Edit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <Link to={`/bands/${params.bandId}/songs/${record.id}/view`} onClick={e => e.stopPropagation()}>
              View
            </Link>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <HeaderWithActions title={`The Thunderdome (${proposedSongCount})`}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary" size="sm">
            <Link to={`/bands/${params.bandId}/songs`}>All Songs</Link>
          </Button>
          <Button asChild size="sm">
            <Link to={`/bands/${params.bandId}/songs/new`}>Propose Song</Link>
          </Button>
        </div>
      </HeaderWithActions>

      <div className="mt-6">
        <TableGeneric
          columns={columns}
          data={proposedSongs}
          onRowClick={record => (window.location.href = `/bands/${params?.bandId}/songs/${record.id}/view`)}
          classNames="max-w-full"
        />
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
