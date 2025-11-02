import { type LoaderFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData, useParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Button } from '#app/components/ui/button'
import { VocalistBadge } from '#app/components/vocalist-badge.tsx'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'

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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">The Thunderdome</h1>
            <p className="text-muted-foreground">
              {proposedSongCount} proposed {proposedSongCount === 1 ? 'song' : 'songs'} awaiting review
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="secondary" size="sm">
              <Link to={`/bands/${params.bandId}/songs`}>All Songs</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={`/bands/${params.bandId}/songs/new`}>Propose Song</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-4">
        {proposedSongs.map(song => (
          <div key={song.id} className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            {/* Song Header */}
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{song.title}</h3>
                <p className="text-muted-foreground">by {song.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  Proposed
                </span>
              </div>
            </div>

            {/* Song Details */}
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Rating</div>
                <div className="font-medium">{song.rating ? `${song.rating}/5` : 'Unrated'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Used in Sets</div>
                <div className="font-medium">{song.setSongCount || 0}</div>
              </div>
              <div className="col-span-2 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Vocalists</div>
                <div className="flex flex-wrap gap-1">
                  {song.vocalists.length > 0 ? (
                    song.vocalists.map((vocalist, vIndex) => (
                      <div key={`${vocalist.user.id}-${vIndex}`} className="flex items-center gap-1">
                        <VocalistBadge user={vocalist.user} compact />
                        <span className="text-xs text-muted-foreground">({vocalist.vocalType})</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">None assigned</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {song.vocalists.some(v => v.notes) && (
              <div className="mb-4">
                <div className="text-xs text-muted-foreground">Notes</div>
                <div className="space-y-1">
                  {song.vocalists
                    .filter(v => v.notes)
                    .map((vocalist, vIndex) => (
                      <div key={`${vocalist.user.id}-notes-${vIndex}`} className="text-sm">
                        <span className="font-medium">{vocalist.user.name || vocalist.user.username}:</span>{' '}
                        <span className="italic text-muted-foreground">"{vocalist.notes}"</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to={`/bands/${params.bandId}/songs/${song.id}/edit`}>Edit</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={`/bands/${params.bandId}/songs/${song.id}/view`}>View</Link>
              </Button>
              {song.lyricId && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/bands/${params.bandId}/songs/${song.id}/lyrics`}>Lyrics</Link>
                </Button>
              )}
              {song.youtubeUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={song.youtubeUrl} target="_blank" rel="noreferrer">
                    YouTube
                  </a>
                </Button>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(
                      `${song.title} by ${song.artist}`,
                    )}+youtube+video`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Search YouTube
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />
}
