import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@repo/ui/components/input-group';
import { Search } from 'lucide-react';

type DataTableHeaderProps = {
  createComponent?: React.ReactNode;
  // search: string;
  // setSearch: (search: string) => void;
};
export function DataTableHeader({
  createComponent,
  // search,
  // setSearch,
}: DataTableHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <InputGroup className="max-w-md">
          <InputGroupInput
            placeholder="Search..."
            // value={search}
            // onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex items-center">{createComponent}</div>
    </div>
  );
}
