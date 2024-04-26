import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { Dialog, Transition } from '@headlessui/react'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { Fragment } from 'react'
import { z } from 'zod'
import { Field } from '#app/components/forms.js'
import { Button } from '#app/components/ui/button.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const ContactSchema = z.object({
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email address').optional(),
  contactPhone: z.string().min(1, 'Contact phone is required'),
})

export async function action({ request, params }: ActionFunctionArgs) {
  console.log('\n', `hello action `, '\n')
  const formData = await request.formData()

  const userId = await requireUserId(request)
  invariantResponse(userId, 'You must be logged in to create a venue')

  const bandId = params.bandId
  invariantResponse(bandId, 'You must provide a band ID')

  const submission = parseWithZod(formData, { schema: ContactSchema })

  if (submission.status !== 'success') {
    console.log('\n', `alpha `, '\n')
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  console.log('\n', `beta `, '\n')
  const { contactEmail, contactName, contactPhone } = submission.value

  try {
    await prisma.venue.update({
      where: {
        id: params.venueId,
      },
      data: {
        contacts: {
          create: [
            {
              name: contactName,
              email: contactEmail,
              phone: contactPhone,
              status: 'active',
            },
          ],
        },
      },
    })
  } catch (error) {
    console.error('\n', `failed to update contacts, error:`, error, '\n')
  }

  const redirectUrl = `/bands/${bandId}/venues/${params.venueId}/view`

  return redirect(redirectUrl)
}

export default function MyModal() {
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: 'create-venue-form',
    constraint: getZodConstraint(ContactSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: ContactSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
  })

  console.log('\n', `actionData = `, actionData, '\n')

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="min-w-full transform overflow-hidden rounded-2xl bg-muted px-2 py-6 text-left align-middle shadow-xl transition-all sm:min-w-[600px] sm:px-6">
                <Form navigate={false} method="post" {...getFormProps(form)}>
                  <Dialog.Title as="h3" className="mb-4 text-h5 font-medium leading-6">
                    Add a Contact
                  </Dialog.Title>
                  <Field
                    labelProps={{
                      htmlFor: fields.contactName.id,
                      children: 'Contact Name',
                    }}
                    inputProps={getInputProps(fields.contactName, { type: 'text' })}
                    errors={fields.contactName.errors}
                  />

                  <Field
                    labelProps={{
                      htmlFor: fields.contactEmail.id,
                      children: 'Contact Email',
                    }}
                    inputProps={getInputProps(fields.contactEmail, { type: 'email' })}
                    errors={fields.contactEmail.errors}
                  />

                  <Field
                    labelProps={{
                      htmlFor: fields.contactPhone.id,
                      children: 'Contact Phone',
                    }}
                    inputProps={getInputProps(fields.contactPhone, { type: 'text' })}
                    errors={fields.contactPhone.errors}
                  />

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Link to=".." tabIndex={-1}>
                      <Button variant="destructive">Cancel</Button>
                    </Link>
                    <Button variant="secondary" type="submit">
                      Add Contact
                    </Button>
                  </div>
                </Form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
