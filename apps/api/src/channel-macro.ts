import Elysia from "elysia";

export const channelMacro = new Elysia({ name: "channel" }).macro({
  channel: {
    resolve({ request: { headers } }) {
      const cookie = headers.get("Cookie");
      const selectedChannelId = getCookie("selected_channel", cookie);
      return {
        selectedChannelId: selectedChannelId,
      };
    },
  },
});

export function getCookie(
  name: string,
  cookieHeader: string | undefined | null,
) {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}
