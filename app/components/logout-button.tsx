import { Form } from '@remix-run/react'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

export const LogoutButton = () => {
  return (
    <Form action="/logout" method="POST">
      <Button type="submit" variant="ghost" size="sm" className="p-0">
        <Icon name="exit">Logout</Icon>
      </Button>
    </Form>
  )
}
