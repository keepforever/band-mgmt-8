// EditTechForm.tsx
import { getFormProps, getInputProps, useForm, getSelectProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList, SelectField } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server'

import { prisma } from '#app/utils/db.server.ts'

const TechSchema = z.object({
  name: z.string().min(1, 'Tech name is required'),
  contactInfo: z.string().min(1, 'Contact info is required'),
  serviceTypeId: z.string().min(1, 'Service type is required'),
  phone: z.string().optional(),
  email: z.string().optional(),
  rate: z.number().optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const techId = params.techId

  invariantResponse(userId, 'You must be logged in to manage a tech')
  invariantResponse(techId, 'Tech ID is required for updating')

  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: TechSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { name, contactInfo, serviceTypeId, email, phone, rate } = submission.value

  await prisma.tech.update({
    where: { id: techId },
    data: {
      name,
      contactInfo,
      email,
      phone,
      rate,
      serviceType: {
        connect: {
          id: serviceTypeId,
        },
      },
    },
  })

  return redirect(`/bands/${params.bandId}/techs`)
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const techId = params.techId

  const tech = await prisma.tech.findUnique({
    where: { id: techId },
    include: {
      serviceType: true,
    },
  })

  const serviceTypes = await prisma.serviceType.findMany({
    select: { id: true, name: true },
  })

  return json({ tech, serviceTypes })
}

export default function EditTechRoute() {
  const actionData = useActionData<typeof action>()
  const { tech, serviceTypes } = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    id: 'edit-tech-form',
    constraint: getZodConstraint(TechSchema),
    lastResult: actionData?.result,
    defaultValue: tech,
  })

  const selectOptions = serviceTypes.map(st => ({ label: st.name, value: st.id }))

  return (
    <div className="max-w-2xl">
      <Form method="POST" {...getFormProps(form)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-2 flex flex-wrap-reverse items-center justify-between gap-2">
          <h1 className="text-body-lg font-bold">Edit a Tech</h1>

          <StatusButton className="col-span-2 mt-4" status={form.status ?? 'idle'} type="submit">
            Submit Changes
          </StatusButton>
        </div>

        <SelectField
          className="col-span-2 sm:col-span-1"
          selectClassName="w-full"
          label="Service Type"
          labelHtmlFor={getSelectProps(fields.serviceTypeId).id}
          options={[{ label: 'Select a Service Type', value: '' }, ...selectOptions]}
          selectProps={getSelectProps(fields.serviceTypeId)}
          getOptionLabel={(option: { label: string; value: string }) => option.label}
          getOptionValue={(option: { label: string; value: string }) => option.value}
          errors={fields.serviceTypeId.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.name.id,
            children: 'Tech Name',
          }}
          inputProps={getInputProps(fields.name, { type: 'text' })}
          errors={fields.name.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.phone.id,
            children: 'Phone',
          }}
          inputProps={getInputProps(fields.phone, { type: 'text' })}
          errors={fields.phone.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.email.id,
            children: 'Email',
          }}
          inputProps={getInputProps(fields.email, { type: 'text' })}
          errors={fields.email.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.rate.id,
            children: 'Rate',
          }}
          inputProps={getInputProps(fields.rate, { type: 'number' })}
          errors={fields.rate.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.contactInfo.id,
            children: 'Contact Info',
          }}
          inputProps={getInputProps(fields.contactInfo, { type: 'text' })}
          errors={fields.contactInfo.errors}
        />

        <br />
        <ErrorList className="col-span-2" errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
