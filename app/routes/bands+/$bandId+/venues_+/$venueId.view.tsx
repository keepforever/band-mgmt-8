import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/node'
import { Form, Link, Outlet, useLoaderData, useParams } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { formatDate } from '#app/utils/misc'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  invariantResponse(userId, 'Unauthorized access')
  const venueId = params.venueId

  if (!userId || !venueId) throw new Error('Unauthorized access or missing venue ID')

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: {
      id: true,
      name: true,
      location: true,
      capacity: true,
      contacts: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      events: {
        select: {
          date: true,
          location: true,
          name: true,
          id: true,
          setlist: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!venue) throw new Error('Venue not found')

  return json({ venue })
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const userId = await requireUserId(request)
  invariantResponse(userId, 'Unauthorized access')

  const formData = await request.formData()
  const contactId = formData.get('contactId') as string
  invariantResponse(contactId, 'Missing contact ID')

  try {
    await prisma.venueContact.delete({
      where: {
        id: contactId,
      },
    })
    console.log('Venue contact deleted successfully')
  } catch (error) {
    console.error('Error deleting venue contact:', error)
    throw error
  }

  return json({ success: true })
}

export default function VenueDetails() {
  const { venue } = useLoaderData<typeof loader>()
  const { bandId } = useParams()

  return (
    <div>
      <div className="flex justify-between px-4 sm:px-0">
        <h3 className="text-lg font-semibold leading-7">
          {venue?.name}, located at {venue?.location}
        </h3>

        <Link relative="path" to={`../edit`} className="text-hyperlink hover:underline">
          <Button size="sm">Edit Venue</Button>
        </Link>
      </div>

      <div className="mt-6 border-t border-border">
        <dl className="divide-y divide-border">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Name</dt>
            <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">{venue?.name}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Location</dt>
            <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">{venue?.location}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Capacity</dt>
            <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">{venue?.capacity}</dd>
          </div>

          {/* Contact */}

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Contacts</dt>

            <dd className="mt-1 flex flex-wrap items-center gap-5 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
              {venue?.contacts &&
                venue.contacts.length > 0 &&
                venue.contacts.map(contact => (
                  <div key={contact.id} className="relative rounded-sm px-3 py-1 outline outline-border">
                    <Form method="post" navigate={false}>
                      <Button
                        size="sm"
                        type="submit"
                        className="absolute -right-3 -top-3 h-5 cursor-pointer rounded-full bg-destructive stroke-white/75 p-1 hover:bg-destructive/65 hover:stroke-yellow-400"
                      >
                        <Icon className="h-3 w-3" name="cross-1" />
                      </Button>
                      <input type="hidden" name="contactId" value={contact.id} />
                    </Form>

                    <p className="text-body-sm">{contact.name}</p>
                    {/*  eslint-disable-next-line remix-react-routes/use-link-for-routes */}
                    <a className="text-hyperlink hover:text-hyperlink-hover" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                    {/*  eslint-disable-next-line remix-react-routes/use-link-for-routes */}
                    <a href={`tel:${contact.phone}`} className="block font-mono">
                      {contact.phone}
                    </a>
                  </div>
                ))}
              <Link to="add-contact">
                <Button size="sm">Add</Button>
              </Link>
            </dd>
          </div>

          {/* Events */}
          {venue?.events.length > 0 && (
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6">Events</dt>
              <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
                <ul className="divide-y divide-border">
                  {venue?.events.map(event => (
                    <li key={event.date} className="flex justify-between py-2">
                      <div>
                        <p className="text-sm font-medium leading-6">{formatDate(event.date)}</p>
                        <p className="text-sm leading-6 text-accent-foreground">{event.location}</p>
                      </div>
                      <Link to={`/bands/${bandId}/events/${event.id}/view`} className="text-hyperlink hover:underline">
                        View Event
                      </Link>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <Outlet />
    </div>
  )
}
