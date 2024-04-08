import { getFormProps, getInputProps, getSelectProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { Label } from '#app/components/ui/label'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc'

const EventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.string().min(1, 'Event date is required'),
  location: z.string().min(1, 'Event location is required'),
  venueId: z.string().min(1, 'Venue ID is required'),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const bandId = params.bandId
  const eventId = params.eventId // Assuming `eventId` is a part of your URL params

  invariantResponse(userId, 'You must be logged in to perform this action')

  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: EventSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { name, date, location, venueId } = submission.value

  if (eventId) {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        name,
        date: new Date(date),
        location,
        venue: {
          connect: {
            id: venueId,
          },
        },
      },
    })
  } else {
    await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        location,
        venue: {
          connect: {
            id: venueId,
          },
        },
        bands: {
          create: [
            {
              bandId: bandId as string,
            },
          ],
        },
      },
    })
  }

  return redirect(`/bands/${bandId}/events`)
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const venues = await prisma.venue.findMany({
    where: {
      bands: {
        none: {
          bandId: userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      location: true,
    },
  })

  const eventId = params.eventId

  const event = await prisma.event?.findUnique({
    where: {
      id: eventId,
    },
    include: {
      venue: true,
      bands: true,
    },
  })

  return json({ venues, event })
}

export default function EditEventRoute() {
  const actionData = useActionData<typeof action>()
  const { venues, event } = useLoaderData<typeof loader>()

  const dateRehydratePayload = event?.date ? event.date.split('T')[0] : ''

  const [form, fields] = useForm({
    id: 'create-event-form',
    constraint: getZodConstraint(EventSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: EventSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
    defaultValue: {
      name: event?.name ?? '',
      date: dateRehydratePayload,
      location: event?.location ?? '',
      venueId: event?.venue?.id ?? '',
    },
  })

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">Submit a New Event</h1>
      <Form method="POST" {...getFormProps(form)} className="mt-6">
        <Field
          labelProps={{
            htmlFor: fields.name.id,
            children: 'Event Name',
          }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            autoFocus: true,
          }}
          errors={fields.name.errors}
        />
        <Field
          labelProps={{
            htmlFor: fields.date.id,
            children: 'Event Date',
          }}
          inputProps={getInputProps(fields.date, { type: 'date' })}
          errors={fields.date.errors}
        />
        <Field
          labelProps={{
            htmlFor: fields.location.id,
            children: 'Location',
          }}
          inputProps={getInputProps(fields.location, { type: 'text' })}
          errors={fields.location.errors}
        />

        <Label htmlFor={getSelectProps(fields.venueId).id} children="Venue" />

        <select
          {...getSelectProps(fields.venueId)}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
          )}
        >
          <option value="">Select a Venue</option>
          {venues.map(venue => (
            <option key={venue.id} value={venue.id}>
              {venue.name} - {venue.location}
            </option>
          ))}
        </select>

        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Submit Event
        </StatusButton>
        <br />
        <ErrorList errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
