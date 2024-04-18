import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { CardContent, Card } from '#app/components/ui/card'
import { Icon, type IconName } from './ui/icon'

interface EmptyStateProps {
  iconNames?: IconName[]
  title?: string
  messages?: string[]
  linkTo?: string
  buttonTitle?: string
}

export function EmptyStateGeneric({ iconNames, title, messages, linkTo, buttonTitle }: EmptyStateProps) {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 p-10">
        {iconNames?.map((iconName, index) => (
          <Icon key={index} name={iconName} className="h-40 w-40 fill-red-400 text-gray-400 dark:text-gray-500" />
        ))}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold">{title}</h2>
          {messages?.map((message, index) => (
            <p key={index} className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          ))}
        </div>
        {linkTo && (
          <div className="flex w-full">
            <Link className="w-full" to={linkTo}>
              <Button className="w-full">{buttonTitle}</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
