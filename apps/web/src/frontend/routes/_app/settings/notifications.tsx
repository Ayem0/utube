import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/settings/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings/notifications"!</div>
}
