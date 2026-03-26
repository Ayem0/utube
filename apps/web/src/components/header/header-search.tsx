import { Button } from '@repo/ui/components/button';
import { ButtonGroup } from '@repo/ui/components/button-group';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@repo/ui/components/input-group';
import { cn } from '@repo/ui/lib/utils';
import { useRouter, useSearch } from '@tanstack/react-router';
import { ChevronLeft, Search, SearchIcon } from 'lucide-react';
import { useState } from 'react';

export function HeaderSearch() {
  const value = useSearch({
    from: '/_app/results/',
    shouldThrow: false,
  });

  const [search, setSearch] = useState(value?.q || '');
  const router = useRouter();

  const [active, setActive] = useState(false);

  return (
    <form
      id="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.navigate({
          to: '/results',
          search: {
            q: search,
          },
        });
      }}
      className="flex w-full sm:items-center sm:justify-center gap-1 sm:gap-3"
    >
      <HeaderSearchInput
        className="hidden sm:flex"
        id="search-input"
        search={search}
        setSearch={setSearch}
      />
      <div className="flex w-full sm:hidden justify-end">
        <Button
          variant="ghost"
          className="size-10 rounded-full"
          aria-label="Search"
          type="button"
          onClick={() => setActive(true)}
        >
          <Search className="size-6" />
        </Button>
        <div
          className="absolute inset-0 gap-2 px-2 hidden data-[active=true]:flex w-full items-center bg-background z-10 group"
          data-active={active}
        >
          <Button
            variant="ghost"
            className="size-10 rounded-full"
            aria-label="back"
            type="button"
            onClick={() => setActive(false)}
          >
            <ChevronLeft className="size-6" />
          </Button>
          <HeaderSearchInput
            id="search-input-mobile"
            search={search}
            setSearch={setSearch}
          />
        </div>
      </div>
    </form>
  );
}

function HeaderSearchInput({
  className,
  id,
  search,
  setSearch,
}: {
  className?: string;
  id: string;
  search: string;
  setSearch: (v: string) => void;
}) {
  return (
    <ButtonGroup
      className={cn(
        'w-full max-w-158 justify-end [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-full! ',
        className,
      )}
    >
      <InputGroup className="h-10 has-[[data-slot=input-group-control]:focus-visible]:[&_svg]:block w-full max-w-134 has-[[data-slot=input-group-control]:focus-visible]:max-w-142 rounded-full bg-background!">
        <InputGroupInput
          id={id}
          aria-label="Search input"
          aria-autocomplete="list"
          placeholder="Search"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:text-base! font-sans pb-1.5"
          type="search"
        />
        <InputGroupAddon align="inline-start" className="cursor-text">
          <SearchIcon className="text-muted-foreground hidden w-8! h-5!" />
        </InputGroupAddon>
      </InputGroup>
      <Button
        variant="outline"
        className="h-10 w-16 rounded-r-full!"
        aria-label="Search"
        type="submit"
      >
        <Search className="size-6" />
      </Button>
    </ButtonGroup>
  );
}
