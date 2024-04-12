import { Link } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { CardContent, Card } from '#app/components/ui/card'
import { Icon } from './ui/icon'

export function BandsEmptyState() {
  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-4 p-10">
        {/* <img
          alt="Placeholder"
          className="h-20 w-20 rounded-lg bg-gray-100 p-1 dark:bg-gray-800"
          height="160"
          src="/placeholder.svg"
          style={{
            aspectRatio: '160/160',
            objectFit: 'cover',
          }}
          width="160"
        /> */}
        <Icon name="pope" className="h-40 w-40 fill-red-400 text-gray-400 dark:text-gray-500" />
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold">You haven’t added any bands yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add your first band to get started</p>
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
