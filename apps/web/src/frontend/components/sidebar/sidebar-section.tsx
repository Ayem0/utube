import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui/sidebar';
import { cn } from '@repo/ui/utils';
import { Link, useRouterState } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface SidebarItem {
  label: string;
  url: string;
  icon: LucideIcon;
  iconClassName?: string;
  showWhenCollapsed?: boolean;
}

export interface SidebarSectionProps {
  items: Array<SidebarItem>;
  expandable?: {
    sliceEnd: number;
  };
  label?: string;
  showWhenCollapsed?: boolean;
  classNames?: string;
}
export function SidebarSection({
  items,
  expandable,
  label,
  showWhenCollapsed = false,
  classNames,
}: SidebarSectionProps) {
  const router = useRouterState();
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
        <SidebarGroupLabel className="text-base h-8 pb-1 pl-3 text-sidebar-foreground">
          {label}
        </SidebarGroupLabel>
      )}

      <SidebarMenu className="group-data-[collapsible=icon]:gap-2">
        {itemsToShow.map((item) => (
          <SidebarMenuItem
            key={item.label}
            className={cn(
              'h-10',
              showWhenCollapsed &&
                !item.showWhenCollapsed &&
                'group-data-[collapsible=icon]:hidden',
            )}
          >
            <SidebarMenuButton
              tooltip={item.label}
              className="h-10"
              isActive={router.location.pathname === item.url}
              render={
                <Link to={item.url} className="[&>svg]:size-6 gap-6 px-3 py-2">
                  <item.icon className={item.iconClassName} />
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
