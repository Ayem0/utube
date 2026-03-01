import { Link } from '@tanstack/react-router';
import { Play } from 'lucide-react';

export function HomeLink() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-medium text-xl text-nowrap"
    >
      <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
        <Play className="size-4" />
      </div>
      U-Tube
    </Link>
  );
}
