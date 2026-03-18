export function getCookie(
  name: string,
  cookieHeader: string | undefined | null,
) {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split('; ')
    .find((row) => row.startsWith(name + '='))
    ?.split('=')[1];
}
