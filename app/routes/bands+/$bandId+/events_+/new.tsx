// CreateEventForm.tsx
import { getFormProps, getInputProps, getSelectProps, useForm, getTextareaProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList, CheckboxField, TextareaField } from '#app/components/forms.tsx'
import { Label } from '#app/components/ui/label'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc'

const EventSchema = z.object({
  date: z.string().min(1, 'Event date is required'),
  location: z.string().min(1, 'Event location is required').optional(),
  name: z.string().min(1, 'Event name is required'),
  payment: z.number().int().min(0, 'Payment must be a positive number').optional(),
  requiresPASystem: z.boolean().optional(),
  startEndTime: z
    .string({ description: "i.e. 6pm - 9pm, or TBD if you don't know yet" })
    .min(3, 'A minimum of 3 characters is required for the start and end time'),
  venueId: z.string().min(1, 'Venue ID is required'),
  notes: z.string().max(1000).optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const bandId = params.bandId
  invariantResponse(userId, 'You must be logged in to create an event')

  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: EventSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { name, date, location, venueId, payment, startEndTime, requiresPASystem } = submission.value

  await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      location,
      payment,
      startEndTime,
      requiresPASystem: !!requiresPASystem,
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

  return redirect(`/bands/${bandId}/events`)
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
  return json({ venues })
}

export default function CreateEventRoute() {
  const actionData = useActionData<typeof action>()
  const { venues } = useLoaderData<typeof loader>()
  const [form, fields] = useForm({
    id: 'create-event-form',
    constraint: getZodConstraint(EventSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: EventSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">Submit a New Event</h1>
      <Form method="POST" {...getFormProps(form)} className="mt-6">
        {/* Start End Time Input */}
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

        <TextareaField
          labelProps={{ children: 'Notes' }}
          textareaProps={{
            ...getTextareaProps(fields.notes),
          }}
          errors={fields.notes.errors}
        />

        {/* Payment Input */}
        <Field
          labelProps={{
            htmlFor: fields.payment.id,
            children: 'Payment',
          }}
          inputProps={getInputProps(fields.payment, { type: 'number' })}
          errors={fields.payment.errors}
        />

        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Submit Event
        </StatusButton>
        <br />
        <ErrorList errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
