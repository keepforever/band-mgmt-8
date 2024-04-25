// CreateBandForm.tsx
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const BandSchema = z.object({
  name: z.string().min(1, 'Band name is required'),
})

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: BandSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { name } = submission.value

  // Additional logic to handle band creation
  await prisma.band.create({
    data: {
      name,
      // You can add more fields here as needed
      members: {
        create: {
          userId,
          isAdmin: true,
        },
      },
    },
  })

  // Redirect or handle the response as needed
  return redirect('/bands') // Adjust the redirect path as necessary
}

export default function CreateBandRoute() {
  const actionData = useActionData<typeof action>()
  const [form, fields] = useForm({
    id: 'create-band-form',
    constraint: getZodConstraint(BandSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: BandSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">Create Your Band</h1>
      <Form method="POST" {...getFormProps(form)} className="mt-6">
        <Field
          labelProps={{
            htmlFor: fields.name.id,
            children: 'Band Name',
          }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            autoFocus: true,
          }}
          errors={fields.name.errors}
        />
        <ErrorList errors={form.errors} id={form.errorId} />
        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Create Band
        </StatusButton>
      </Form>
    </div>
  )
}
