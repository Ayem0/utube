import { HeaderCenter } from './header-center';
import { HeaderEnd } from './header-end';
import { HeaderStart } from './header-start';

export function Header() {
  return (
    <header
      className="bg-transparent/05 sticky z-20 w-full h-14 top-0 bg-(--header-background)"
      style={{ backdropFilter: 'blur(48px)' }}
    >
      <div className="flex py-2 px-2 sm:px-4 sm:gap-6 md:gap-10 items-center justify-between relative">
        <HeaderStart />
        <HeaderCenter />
        <HeaderEnd />
      </div>
    </header>
  );
}
