import { Button } from '@repo/ui/button';
import { ButtonGroup } from '@repo/ui/button-group';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@repo/ui/input-group';
import { useRouter, useSearch } from '@tanstack/react-router';
import { Mic, Search, SearchIcon } from 'lucide-react';
import { useState } from 'react';

export function HeaderSearchInput() {
  const value = useSearch({
    from: '/_app/results/',
    shouldThrow: false,
  });

  const [search, setSearch] = useState(value?.q || '');
  const router = useRouter();

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
      className="flex w-full items-center justify-center gap-3"
    >
      <ButtonGroup className="flex w-full max-w-158 justify-end [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-full! ">
        <InputGroup className="h-10 has-[[data-slot=input-group-control]:focus-visible]:[&_svg]:block w-full max-w-134 has-[[data-slot=input-group-control]:focus-visible]:max-w-142 rounded-full bg-background!">
          <InputGroupInput
            id="search-input"
            aria-label="Search input"
            aria-autocomplete="list"
            placeholder="Search"
            autoComplete="off"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:text-base! font-sans pb-1.5 "
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
      <Button
        variant="outline"
        type="button"
        aria-label="Voice search"
        className="rounded-full size-10"
      >
        <Mic className="size-6" />
      </Button>
    </form>
  );
}
