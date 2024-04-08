import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button'
import { requireUserId } from '#app/utils/auth.server'
import { useOptionalUser } from '#app/utils/user'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  return json({ userId })
}

export default function BandsIndex() {
  const user = useOptionalUser()
  const navigate = useNavigate()

  const bandsUserAdministrates = user?.bands.filter(band => band.isAdmin)
  const bandsUserIsMemberOf = user?.bands.filter(band => !band.isAdmin)

  return (
    <div>
      <div className="flex justify-between">
        <h1>Bands Index</h1>
        <Button asChild variant="default" size="lg">
          <Link to="new">Create</Link>
        </Button>
      </div>

      <h2>Admin Bands</h2>
      <table className="mb-6 w-full table-auto border-red-600">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Band Name</th>
          </tr>
        </thead>
        <tbody>
          {bandsUserAdministrates?.map(bandMember => (
            <tr
              key={bandMember.band.name}
              onClick={() => navigate(`${bandMember.band.id}`)}
              className="cursor-pointer transition-colors duration-200 ease-in-out hover:bg-red-800"
            >
              <td className="border border-red-400 px-4 py-2">{bandMember.band.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Member Bands</h2>
      <table className="mb-3 w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Band Name</th>
          </tr>
        </thead>
        <tbody>
          {bandsUserIsMemberOf?.map(bandMember => (
            <tr
              key={bandMember.band.name}
              onClick={() => navigate(`${bandMember.band.id}`)}
              className="cursor-pointer transition-colors duration-200 ease-in-out hover:bg-red-800"
            >
              <td className="border border-red-300 px-4 py-2">{bandMember.band.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
