import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { CardContent, Card } from '#app/components/ui/card'
import { Icon } from './ui/icon'

export function BandsEmptyState() {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 p-10">
        <Icon name="rocket" className="h-40 w-40 fill-accent-two " />

        {/* <Icon name="monkey" className="h-40 w-40 bg-destructive fill-blue-200 stroke-red-400" /> */}

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-body-lg font-bold">You haven’t added any bands yet</h2>

          <p className="text-sm text-muted-foreground">
            Add your first band to get started or join an existing band via invitation.
          </p>

          <p className="text-sm text-muted-foreground">You can be invited by a band admin after providing them your</p>
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
