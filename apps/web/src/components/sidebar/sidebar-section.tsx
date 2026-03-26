import { routeTree } from '@/routeTree.gen';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui/components/sidebar';
import { cn } from '@repo/ui/lib/utils';
import { Link, LinkProps } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type AppLink = LinkProps<typeof routeTree>;

type SidebarItem = {
  label: string;
  url: AppLink;
  icon?: LucideIcon;
  iconClassName?: string;
  showWhenCollapsed?: boolean;
};

export interface SidebarSectionProps {
  items: Array<SidebarItem>;
  expandable?: {
    sliceEnd: number;
  };
  label?: string;
  showWhenCollapsed?: boolean;
  classNames?: string;
  labelClassName?: string;
}
export function SidebarSection({
  items,
  expandable,
  label,
  showWhenCollapsed = false,
  classNames,
  labelClassName,
}: SidebarSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const itemsToShow = expandable
    ? expanded
      ? items
      : items.slice(0, expandable.sliceEnd)
    : items;
  return (
    <SidebarGroup
      className={cn(
        'p-3 group-data-[state=collapsed]:px-1 group-data-[state=collapsed]:w-18',
        !showWhenCollapsed && 'group-data-[collapsible=icon]:hidden',
        classNames,
      )}
    >
      {label && (
        <SidebarGroupLabel
          className={cn(
            'text-base h-8 pb-1 pl-3 text-sidebar-foreground',
            labelClassName,
          )}
        >
          {label}
        </SidebarGroupLabel>
      )}

      <SidebarMenu className="gap-0">
        {itemsToShow.map((item) => (
          <SidebarMenuItem
            key={item.label}
            className={cn(
              'h-10 group-data-[collapsible=icon]:size-16',
              showWhenCollapsed &&
                !item.showWhenCollapsed &&
                'group-data-[collapsible=icon]:hidden',
            )}
          >
            <SidebarMenuButton
              tooltip={item.label}
              render={
                <Link
                  {...item.url}
                  className="data-[status=active]:bg-sidebar-accent h-10 [&>svg]:size-6 gap-6 px-3 py-2 group-data-[collapsible=icon]:size-16 flex group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:gap-2 group-data-[state=collapsed]:[&_span]:text-[10px]"
                >
                  {item.icon && <item.icon className={item.iconClassName} />}
                  <span>{item.label}</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        ))}
        {expandable && (
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={expanded ? 'Less' : 'More'}
              className="h-10 [&_svg]:size-6 gap-4 px-3 py-2"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <>
                  <ChevronUp />
                  <span>Less</span>
                </>
              ) : (
                <>
                  <ChevronDown />
                  <span>More</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
