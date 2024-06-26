import { Form, Link, useSubmit } from '@remix-run/react'
import { useRef } from 'react'
import { Button } from '#app/components/ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { getUserImgSrc } from '#app/utils/misc.tsx'
import { useUser } from '#app/utils/user.ts'

export function UserDropdown() {
  const user = useUser()
  const submit = useSubmit()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button asChild variant="secondary">
          <Link
            to={`/users/${user.username}`}
            // this is for progressive enhancement
            onClick={e => e.preventDefault()}
            className="flex items-center gap-2"
          >
            <img
              className="h-8 w-8 rounded-full object-cover"
              alt={user.name ?? user.username}
              src={getUserImgSrc(user.image?.id)}
            />
            <span className="text-body-xs font-bold text-foreground">{user.name ?? user.username}</span>
          </Link>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent sideOffset={8} alignOffset={-20} align="start">
          <DropdownMenuItem asChild>
            <Link prefetch="intent" to={`/users/${user.username}`}>
              <Icon className="text-body-sm" name="avatar">
                Profile
              </Icon>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            // this prevents the menu from closing before the form submission is completed
            onSelect={event => {
              event.preventDefault()
              submit(formRef.current)
            }}
          >
            <Form action="/logout" method="POST" ref={formRef}>
              <Icon className="text-body-sm" name="exit">
                <button type="submit">Logout</button>
              </Icon>
            </Form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}
