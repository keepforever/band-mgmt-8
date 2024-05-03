import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList, CheckboxField, TextareaField, SelectField } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

// Updated schema to include all fields
const EventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.string().min(1, 'Event date is required'),
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

  const { name, date, venueId, payment, requiresPASystem, startEndTime, notes } = submission.value

  await prisma.event.update({
    where: { id: eventId },
    data: {
      name,
      notes,
      payment,
      startEndTime,
      requiresPASystem,
      date: new Date(date),
      venue: {
        connect: {
          id: venueId,
        },
      },
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
          venueId: event.venue?.id,
          payment: event.payment,
          requiresPASystem: event.requiresPASystem,
          startEndTime: event.startEndTime,
          notes: event.notes,
        }
      : {},
    shouldRevalidate: 'onBlur',
  })

  const selectOptions = venues.map(venue => ({
    label: `${venue.name} - ${venue.location}`,
    value: venue.id,
  }))

  return (
    <div className="max-w-2xl">
      <Form method="POST" {...getFormProps(form)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-2 flex flex-wrap-reverse items-center justify-between gap-2">
          <h1 className="text-body-lg font-bold">Edit {event?.name}</h1>

          <StatusButton className="col-span-2 mt-4" status={form.status ?? 'idle'} type="submit">
            Update Event
          </StatusButton>
        </div>

        <CheckboxField
          className="col-span-1"
          labelProps={{
            htmlFor: fields.requiresPASystem.id,
            children: 'Requires PA System',
          }}
          buttonProps={getInputProps(fields.requiresPASystem, {
            type: 'checkbox',
          })}
          errors={fields.requiresPASystem.errors}
        />

        <SelectField
          className="col-span-2 sm:col-span-1"
          selectClassName="w-full"
          label="Venue"
          labelHtmlFor={getSelectProps(fields.venueId).id}
          options={[{ label: 'Select a Venue', value: '' }, ...selectOptions]}
          selectProps={getSelectProps(fields.venueId)}
          getOptionLabel={(option: { label: string; value: string }) => option.label}
          getOptionValue={(option: { label: string; value: string }) => option.value}
          errors={fields.venueId.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.startEndTime.id,
            children: 'Start and End Time',
          }}
          inputProps={getInputProps(fields.startEndTime, { type: 'text' })}
          errors={fields.startEndTime.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
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
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.date.id,
            children: 'Event Date',
          }}
          inputProps={getInputProps(fields.date, { type: 'date' })}
          errors={fields.date.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.payment.id,
            children: 'Payment',
          }}
          inputProps={getInputProps(fields.payment, { type: 'number' })}
          errors={fields.payment.errors}
        />

        <TextareaField
          className="col-span-2"
          labelProps={{ children: 'Notes' }}
          textareaProps={{
            ...getTextareaProps(fields.notes),
          }}
          errors={fields.notes.errors}
        />

        <br />
        <ErrorList className="col-span-2" errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
