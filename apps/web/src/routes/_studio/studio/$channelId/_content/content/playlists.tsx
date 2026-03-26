import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_studio/studio/$channelId/_content/content/playlists',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/_studio/studio/$channelId/_content/content/playlists"!</div>
  )
}
