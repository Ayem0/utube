import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_studio/studio/$channelId/_content/content/videos',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_studio/studio/$channelId/content/videos"!</div>
}
