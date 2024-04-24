import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList, CheckboxField, TextareaField } from '#app/components/forms.tsx'
import { Label } from '#app/components/ui/label.js'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.js'

// Updated schema to include all fields
const EventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.string().min(1, 'Event date is required'),
  location: z.string().min(1, 'Event location is required').optional(),
  venueId: z.string().min(1, 'Venue ID is required'),
  payment: z.number().int().min(0, 'Payment must be a positive number').optional(),
  requiresPASystem: z.boolean().optional(),
  startEndTime: z.string().min(3, 'A minimum of 3 characters is required for the start and end time'),
  notes: z.string().max(1000).optional(),
})
export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const bandId = params.bandId
  const eventId = params.eventId

  invariantResponse(userId, 'You must be logged in to perform this action')
  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: EventSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }

  const { name, date, location, venueId, payment, requiresPASystem, startEndTime, notes } = submission.value

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
      payment,
      requiresPASystem,
      startEndTime,
      notes,
    },
  })

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
  const [form, fields] = useForm({
    id: 'edit-event-form',
    constraint: getZodConstraint(EventSchema),
    lastResult: actionData?.result,
    defaultValue: event
      ? {
          name: event.name,
          date: event.date.split('T')[0], // Assuming date is stored in ISO format
          location: event.location,
          venueId: event.venue?.id,
          payment: event.payment,
          requiresPASystem: event.requiresPASystem,
          startEndTime: event.startEndTime,
          notes: event.notes,
        }
      : {},
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">Edit Event</h1>
      <Form method="POST" {...getFormProps(form)} className="mt-6">
        <CheckboxField
          labelProps={{
            htmlFor: fields.requiresPASystem.id,
            children: 'Requires PA System',
          }}
          buttonProps={getInputProps(fields.requiresPASystem, {
            type: 'checkbox',
          })}
          errors={fields.requiresPASystem.errors}
        />

        <Field
          labelProps={{
            htmlFor: fields.startEndTime.id,
            children: 'Start and End Time',
          }}
          inputProps={getInputProps(fields.startEndTime, { type: 'text' })}
          errors={fields.startEndTime.errors}
        />

        <Field
          labelProps={{
            htmlFor: fields.payment.id,
            children: 'Payment',
          }}
          inputProps={getInputProps(fields.payment, { type: 'number' })}
          errors={fields.payment.errors}
        />

        <TextareaField
          labelProps={{ children: 'Notes' }}
          textareaProps={{
            ...getTextareaProps(fields.notes),
          }}
          errors={fields.notes.errors}
        />

        {/* Venue Select */}

        <Label htmlFor={getSelectProps(fields.venueId).id} children="Venue" className="mt-0" />

        <select
          {...getSelectProps(fields.venueId)}
          className={cn(
            'mb-0 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
          )}
        >
          <option value="">Select a Venue</option>
          {venues.map(venue => (
            <option key={venue.id} value={venue.id}>
              {venue.name} - {venue.location}
            </option>
          ))}
        </select>

        <ErrorList errors={fields.venueId.errors} id={fields.venueId.errorId} className="mb-5 pl-4 pt-1" />

        {/* Existing input fields for name, date, location, and venue selection */}

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

        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Update Event
        </StatusButton>
        <ErrorList errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
