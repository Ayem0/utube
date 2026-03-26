import { buttonVariants } from '@repo/ui/components/button';
import { Link, useLocation } from '@tanstack/react-router';

type LoginButtonProps = {
  children?: React.ReactNode;
};

export function LoginButton({ children }: LoginButtonProps) {
  const location = useLocation();
  return (
    <Link
      className={buttonVariants({
        variant: 'outline',
        className: 'h-9 rounded-full! px-4!',
      })}
      to="/login"
      search={{ redirectUrl: location.pathname }}
    >
      {children}
      Login
    </Link>
  );
}
