import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/channel/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/channel/"!</div>
}
