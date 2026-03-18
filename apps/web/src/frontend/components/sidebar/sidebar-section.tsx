import { routeTree } from '@/frontend/routeTree.gen';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui/sidebar';
import { cn } from '@repo/ui/utils';
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
        'p-3',
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

      <SidebarMenu>
        {itemsToShow.map((item) => (
          <SidebarMenuItem
            key={item.label}
            className={cn(
              'h-10 group-data-[collapsible=icon]:h-12',
              showWhenCollapsed &&
                !item.showWhenCollapsed &&
                'group-data-[collapsible=icon]:hidden',
            )}
          >
            <SidebarMenuButton
              tooltip={item.label}
              className="h-10"
              render={
                <Link
                  {...item.url}
                  className="data-[status=active]:bg-sidebar-accent [&>svg]:size-6 gap-6 px-3 py-2"
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
