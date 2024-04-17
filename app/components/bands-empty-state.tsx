import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { CardContent, Card } from '#app/components/ui/card'
import { Icon } from './ui/icon'

export function BandsEmptyState() {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 p-10">
        <Icon name="pope" className="h-40 w-40 fill-red-400 text-gray-400 dark:text-gray-500" />
        <Icon name="monkey" className="h-40 w-40 fill-red-400 text-gray-400 dark:text-gray-500" />
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold">You haven’t added any bands yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add your first band to get started or join an existing band via invitation.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You can be invited by a band admin after providing them your
          </p>
        </div>
        <div className="flex w-full">
          <Link className="w-full" to="/">
            <Button className="w-full">Add Band</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
