import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { getCookie } from '../utils/get-cookie';

export const getSidebarCookie = createServerFn({
  method: 'GET',
}).handler(() => {
  const cookies = getRequestHeader('Cookie');
  const sidebarState = getCookie('sidebar_state', cookies);
  return sidebarState ? sidebarState === 'true' : true;
});
