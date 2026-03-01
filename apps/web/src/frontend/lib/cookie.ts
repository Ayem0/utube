import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';

export const getSidebarCookie = createServerFn({
  method: 'GET',
}).handler(() => {
  const cookies = getRequestHeader('Cookie');
  const sidebarState = getCookie('sidebar_state', cookies);
  return sidebarState ? sidebarState === 'true' : false;
});

function getCookie(name: string, cookieHeader: string | undefined) {
  if (!cookieHeader) return undefined;
  return cookieHeader
    .split('; ')
    .find((row) => row.startsWith(name + '='))
    ?.split('=')[1];
}
