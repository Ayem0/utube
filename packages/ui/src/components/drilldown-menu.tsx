// 'use client';

// import { cn } from '@/frontend/lib/utils';
// import { Menu as MenuPrimitive } from '@base-ui/react/menu';
// import { ChevronLeft, ChevronRightIcon } from 'lucide-react';
// import * as React from 'react';

// function DrillDownMenu({ ...props }: MenuPrimitive.Root.Props) {
//   return <MenuPrimitive.Root data-slot="drill-down-menu" {...props} />;
// }

// function DrillDownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
//   return (
//     <MenuPrimitive.Trigger data-slot="drill-down-menu-trigger" {...props} />
//   );
// }

// function DrillDownMenuContent({
//   align = 'start',
//   alignOffset = 0,
//   side = 'bottom',
//   sideOffset = 4,
//   className,
//   ...props
// }: MenuPrimitive.Popup.Props &
//   Pick<
//     MenuPrimitive.Positioner.Props,
//     'align' | 'alignOffset' | 'side' | 'sideOffset'
//   >) {
//   return (
//     <MenuPrimitive.Portal>
//       <MenuPrimitive.Positioner
//         className="isolate z-50 outline-none"
//         align={align}
//         alignOffset={alignOffset}
//         side={side}
//         sideOffset={sideOffset}
//       >
//         <MenuPrimitive.Popup
//           data-slot="dropdown-menu-content"
//           className={cn(
//             'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none data-closed:overflow-hidden',
//             className,
//           )}
//           {...props}
//         />
//       </MenuPrimitive.Positioner>
//     </MenuPrimitive.Portal>
//   );
// }

// function DrillDownMenuItem({
//   className,
//   inset,
//   ...props
// }: MenuPrimitive.Item.Props & {
//   inset?: boolean;
// }) {
//   return (
//     <MenuPrimitive.Item
//       data-slot="drill-down-menu-item"
//       className={cn(
//         'focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-50',
//         inset && 'pl-8',
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// function DrillDownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
//   return <MenuPrimitive.Group data-slot="drill-down-menu-group" {...props} />;
// }

// function DrillDownMenuLabel({
//   className,
//   inset,
//   ...props
// }: MenuPrimitive.GroupLabel.Props & {
//   inset?: boolean;
// }) {
//   return (
//     <MenuPrimitive.GroupLabel
//       data-slot="drill-down-menu-label"
//       className={cn(
//         'px-2 py-1.5 text-sm font-semibold',
//         inset && 'pl-8',
//         className,
//       )}
//       {...props}
//     />
//   );
// }

// function DrillDownMenuSeparator({
//   className,
//   ...props
// }: MenuPrimitive.Separator.Props) {
//   return (
//     <MenuPrimitive.Separator
//       data-slot="drill-down-menu-separator"
//       className={cn('-mx-1 my-1 h-px bg-muted', className)}
//       {...props}
//     />
//   );
// }

// /*
//   Drill-down specific components using Checkbox Hack
// */

// const SubMenuContext = React.createContext<{ id: string } | null>(null);

// function DrillDownMenuSub({ children }: { children: React.ReactNode }) {
//   const id = React.useId();
//   return (
//     <SubMenuContext.Provider value={{ id }}>{children}</SubMenuContext.Provider>
//   );
// }

// function DrillDownMenuSubTrigger({
//   children,
//   className,
//   inset,
// }: {
//   children: React.ReactNode;
//   className?: string;
//   inset?: boolean;
// }) {
//   const context = React.useContext(SubMenuContext);
//   if (!context) {
//     throw new Error(
//       'DrillDownMenuSubTrigger must be used within a DrillDownMenuSub',
//     );
//   }
//   const labelRef = React.useRef<HTMLLabelElement>(null);
//   return (
//     <MenuPrimitive.Item
//       closeOnClick={false}
//       onKeyDown={(e) => {
//         console.log('here', e.key);
//         if (e.key === 'Enter' || e.key === ' ') {
//           e.preventDefault();
//           labelRef.current?.click();
//         }
//       }}
//       render={
//         <label
//           ref={labelRef}
//           htmlFor={context.id}
//           className={cn(
//             'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
//             inset && 'pl-8',
//             className,
//           )}
//         >
//           {children}
//           <ChevronRightIcon className="ml-auto h-4 w-4" />
//         </label>
//       }
//     />
//   );
// }

// function DrillDownMenuSubContent({
//   className,
//   children,
//   ...props
// }: React.HTMLAttributes<HTMLDivElement>) {
//   const context = React.useContext(SubMenuContext);
//   if (!context) {
//     throw new Error(
//       'DrillDownMenuSubContent must be used within a DrillDownMenuSub',
//     );
//   }
//   return (
//     <div>
//       <input type="checkbox" id={context.id} className="hidden peer" />
//       <div
//         className={cn(
//           'bg-popover rounded-lg outline-none ring-1 ring-foreground/10 shadow-md absolute bottom-0 right-0 min-w-32 z-10 hidden flex-col overflow-y-auto p-1 duration-200 animate-in fade-in-0 slide-in-from-right-10 peer-checked:flex',
//           className,
//         )}
//         {...props}
//       >
//         {children}
//       </div>
//     </div>
//   );
// }

// function DrillDownMenuBack({
//   children,
//   className,
// }: {
//   children?: React.ReactNode;
//   className?: string;
// }) {
//   const context = React.useContext(SubMenuContext);
//   if (!context) {
//     throw new Error('DrillDownMenuBack must be used within a DrillDownMenuSub');
//   }
//   const labelRef = React.useRef<HTMLLabelElement>(null);
//   return (
//     <MenuPrimitive.Item
//       closeOnClick={false}
//       onKeyDown={(e) => {
//         if (e.key === 'Enter' || e.key === ' ') {
//           e.preventDefault();
//           labelRef.current?.click();
//         }
//       }}
//       render={
//         <label
//           htmlFor={context.id}
//           ref={labelRef}
//           className={cn(
//             'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-sm flex cursor-pointer select-none items-center px-2 py-1.5 text-sm font-medium outline-none',
//             className,
//           )}
//         >
//           <ChevronLeft className="mr-2 h-4 w-4" />
//           {children || 'Back'}
//         </label>
//       }
//     />
//   );
// }

// export {
//   DrillDownMenu,
//   DrillDownMenuBack,
//   DrillDownMenuContent,
//   DrillDownMenuGroup,
//   DrillDownMenuItem,
//   DrillDownMenuLabel,
//   DrillDownMenuSeparator,
//   DrillDownMenuSub,
//   DrillDownMenuSubContent,
//   DrillDownMenuSubTrigger,
//   DrillDownMenuTrigger,
// };
"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronLeft, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

type DrillContextShape = {
  openSubId: string | null;
  setOpenSubId: (id: string | null) => void;
};

const DrillContext = React.createContext<DrillContextShape | null>(null);

/* -------------------------------------------------------------------------- */
/*  Root + trigger + popup                                                    */
/* -------------------------------------------------------------------------- */

function DrillDownMenu({ children, ...props }: MenuPrimitive.Root.Props) {
  // central state: which submenu (id) is currently open
  const [openSubId, setOpenSubId] = React.useState<string | null>(null);

  // intercept open change to reset any open sub when menu closes
  const userOnOpenChange = (props as any).onOpenChange;
  function handleOpenChange(open: boolean) {
    if (!open) {
      setOpenSubId(null);
    }
    if (typeof userOnOpenChange === "function") userOnOpenChange(open);
  }

  return (
    <DrillContext.Provider value={{ openSubId, setOpenSubId }}>
      <MenuPrimitive.Root {...props} onOpenChange={handleOpenChange}>
        {children}
      </MenuPrimitive.Root>
    </DrillContext.Provider>
  );
}

function DrillDownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger data-slot="drill-down-menu-trigger" {...props} />
  );
}

function DrillDownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  container,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > &
  Pick<MenuPrimitive.Portal.Props, "container">) {
  return (
    <MenuPrimitive.Portal container={container}>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-right-2 data-[side=inline-end]:slide-in-from-left-2 z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none data-closed:overflow-hidden",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

/* -------------------------------------------------------------------------- */
/*  Basic items, groups, labels, separators                                   */
/*                                                                            */
/*  These consult DrillContext + SubMenuContext to hide/disable themselves    */
/*  when another submenu is open so keyboard navigation can't reach them.     */
/* -------------------------------------------------------------------------- */

function useDrillVisibility() {
  const drill = React.useContext(DrillContext);
  return drill;
}

// Existing SubMenuContext (identifies "this" submenu's id for descendants)
const SubMenuContext = React.createContext<{ id: string } | null>(null);

function DrillDownMenuItem({
  className,
  inset,
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
}) {
  const drill = useDrillVisibility();
  const sub = React.useContext(SubMenuContext);

  // Hide/disable item when some submenu is open and this item is NOT in the active submenu:
  const shouldHide =
    drill && drill.openSubId !== null && sub?.id !== drill.openSubId;

  return (
    <MenuPrimitive.Item
      data-slot="drill-down-menu-item"
      disabled={shouldHide ?? undefined} // MenuPrimitive should treat disabled items as non-focusable
      className={cn(
        // visually hide when shouldHide. Keeping it removed from layout is fine.
        shouldHide ? "hidden" : "",
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DrillDownMenuGroup({ children, ...props }: MenuPrimitive.Group.Props) {
  const drill = useDrillVisibility();

  // If some submenu is open, hide whole group unless it's inside that submenu.
  // The Group itself can be inside a SubMenu (via SubMenuContext), but group-level
  // hiding is handled by consuming components too.
  const shouldHide = drill && drill.openSubId !== null;

  return (
    <MenuPrimitive.Group
      data-slot="drill-down-menu-group"
      className={shouldHide ? "" : undefined}
      {...props}
    >
      {children}
    </MenuPrimitive.Group>
  );
}

function DrillDownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  const drill = useDrillVisibility();
  const shouldHide = drill && drill.openSubId !== null;

  return (
    <MenuPrimitive.GroupLabel
      data-slot="drill-down-menu-label"
      className={cn(
        shouldHide ? "hidden" : "",
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DrillDownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  const drill = useDrillVisibility();
  const shouldHide = drill && drill.openSubId !== null;

  return (
    <MenuPrimitive.Separator
      data-slot="drill-down-menu-separator"
      className={cn(
        shouldHide ? "hidden" : "",
        "-mx-1 my-1 h-px bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Drill-down specific components                                            */
/*  - DrillDownMenuSub provides an id for the subtree                         */
/*  - DrillDownMenuSubTrigger opens that submenu via DrillContext            */
/*  - DrillDownMenuSubContent only mounts its children when the submenu is    */
/*    open (so they are not part of MenuPrimitive's item list while hidden)   */
/*  - DrillDownMenuBack closes the submenu                                    */
/* -------------------------------------------------------------------------- */

function DrillDownMenuSub({ children }: { children: React.ReactNode }) {
  const id = React.useId();
  return (
    <SubMenuContext.Provider value={{ id }}>{children}</SubMenuContext.Provider>
  );
}

function DrillDownMenuSubTrigger({
  children,
  className,
  inset,
}: {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}) {
  const sub = React.useContext(SubMenuContext);
  const drill = React.useContext(DrillContext);
  if (!sub) {
    throw new Error(
      "DrillDownMenuSubTrigger must be used within a DrillDownMenuSub",
    );
  }
  if (!drill) {
    throw new Error(
      "DrillDownMenuSubTrigger must be used within a DrillDownMenu",
    );
  }

  // When activated, set the open sub id. Keep closeOnSelect false so the root menu stays open.
  return (
    <MenuPrimitive.Item
      closeOnClick={false}
      disabled={drill.openSubId !== null}
      onKeyDown={(e) => {
        // Enter / Space should open the submenu and prevent default so the menu primitive
        // doesn't treat it like an activate/close event.
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          drill.setOpenSubId(sub.id);
        }
      }}
      onClick={(e) => {
        // open submenu
        e.preventDefault();
        drill.setOpenSubId(sub.id);
      }}
      render={
        // Render as a label-like element for styling & cursor
        <div
          role="button"
          aria-haspopup="menu"
          aria-expanded={drill.openSubId === sub.id}
          className={cn(
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
            inset && "pl-8",
            className,
          )}
        >
          {children}
          <ChevronRightIcon className="ml-auto h-4 w-4" />
        </div>
      }
    />
  );
}

function DrillDownMenuSubContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const sub = React.useContext(SubMenuContext);
  const drill = React.useContext(DrillContext);
  if (!sub) {
    throw new Error(
      "DrillDownMenuSubContent must be used within a DrillDownMenuSub",
    );
  }
  if (!drill) {
    throw new Error(
      "DrillDownMenuSubContent must be used within a DrillDownMenu",
    );
  }

  const isOpen = drill.openSubId === sub.id;

  // Only render the submenu content when it's open. This ensures MenuPrimitive
  // doesn't have hidden submenu MenuPrimitive.Items in its item list.
  // Position it absolutely so it visually appears as an overlay/slide from right.
  return isOpen ? (
    <div
      className={cn(
        "bg-popover rounded-lg outline-none ring-1 ring-foreground/10 shadow-md absolute left-0 bottom-0 min-w-32 z-10 flex flex-col overflow-y-auto p-1 duration-200 animate-in fade-in-0 slide-in-from-right-10",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ) : null;
}

function DrillDownMenuBack({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const sub = React.useContext(SubMenuContext);
  const drill = React.useContext(DrillContext);
  if (!sub || !drill) {
    throw new Error("DrillDownMenuBack must be used within a DrillDownMenuSub");
  }

  // Back just clears the openSubId
  return (
    <MenuPrimitive.Item
      closeOnClick={false}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          drill.setOpenSubId(null);
        }
      }}
      onClick={(e) => {
        e.preventDefault();
        drill.setOpenSubId(null);
      }}
      render={
        <div
          role="button"
          className={cn(
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-sm flex cursor-pointer select-none items-center px-2 py-1.5 text-sm font-medium outline-none",
            className,
          )}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {children || "Back"}
        </div>
      }
    />
  );
}

export {
  DrillDownMenu,
  DrillDownMenuBack,
  DrillDownMenuContent,
  DrillDownMenuGroup,
  DrillDownMenuItem,
  DrillDownMenuLabel,
  DrillDownMenuSeparator,
  DrillDownMenuSub,
  DrillDownMenuSubContent,
  DrillDownMenuSubTrigger,
  DrillDownMenuTrigger,
};
