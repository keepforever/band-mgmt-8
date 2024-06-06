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

  secondaryButtonTitle?: string
  secondaryLinkTo?: string
  extra?: React.ReactNode
}

export function EmptyStateGeneric({
  iconNames,
  title,
  messages,
  linkTo,
  buttonTitle,
  secondaryButtonTitle,
  secondaryLinkTo,
  extra,
}: EmptyStateProps) {
  return (
    <Card className="mx-auto w-full max-w-lg bg-muted text-muted-foreground">
      <CardContent className="flex flex-col items-center gap-4 p-10">
        {iconNames?.map((iconName, index) => (
          <Icon key={index} name={iconName} className="h-40 w-40 fill-muted-foreground" />
        ))}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-body-lg font-bold text-muted-foreground">{title}</h2>
          {messages?.map((message, index) => (
            <p key={index} className="text-sm text-muted-foreground">
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
        {secondaryLinkTo && (
          <div className="flex w-full">
            <Link className="w-full" to={secondaryLinkTo}>
              <Button className="w-full" variant="secondary">
                {secondaryButtonTitle}
              </Button>
            </Link>
          </div>
        )}

        {extra}
      </CardContent>
    </Card>
  )
}
