import authClient from '@repo/auth/auth-client';
import { DropdownMenuItem } from '@repo/ui/components/dropdown-menu';
import { Spinner } from '@repo/ui/components/spinner';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    queryClient.setQueryData(['auth-session'], null);
    await router.invalidate();
    setIsLoggingOut(false);
  };
  return (
    <DropdownMenuItem
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="gap-2 px-3"
    >
      <LogOut className="size-6" />
      {isLoggingOut ? <Spinner className="mx-auto size-5" /> : 'Log out'}
    </DropdownMenuItem>
  );
}
