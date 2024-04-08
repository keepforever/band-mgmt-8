import { Form } from '@remix-run/react'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

export const LogoutButton = () => {
  return (
    <Form action="/logout" method="POST" className="mt-3">
      <Button type="submit" variant="link" size="sm">
        <Icon name="exit" className="scale-125 max-md:scale-150">
          Logout
        </Icon>
      </Button>
    </Form>
  )
}
