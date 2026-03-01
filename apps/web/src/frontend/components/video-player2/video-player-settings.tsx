import { useVideoPlayerUiDesktop } from '@/frontend/lib/video-player/video-player-context';
import { Button } from '@repo/ui/button';
import {
  DrillDownMenu,
  DrillDownMenuBack,
  DrillDownMenuContent,
  DrillDownMenuGroup,
  DrillDownMenuItem,
  DrillDownMenuSub,
  DrillDownMenuSubContent,
  DrillDownMenuSubTrigger,
  DrillDownMenuTrigger,
} from '@repo/ui/drill-down-menu';
import { Gauge, Settings, SlidersHorizontal } from 'lucide-react';

export function VideoPlayerSettings() {
  const { UI } = useVideoPlayerUiDesktop();

  return (
    <DrillDownMenu
      onOpenChangeComplete={(open) => {
        if (open) {
          UI.openMenu();
        } else {
          UI.closeMenu();
        }
      }}
    >
      <DrillDownMenuTrigger
        render={
          <Button variant="ghost" className="rounded-full size-9">
            <Settings className="size-6" />
          </Button>
        }
      />
      <DrillDownMenuContent side="top" align="center" sideOffset={15}>
        <DrillDownMenuGroup>
          <DrillDownMenuSub>
            <DrillDownMenuSubTrigger>
              <Gauge className="mr-2 h-4 w-4" />
              <span>Playrate</span>
            </DrillDownMenuSubTrigger>
            <DrillDownMenuSubContent>
              <DrillDownMenuBack>Playrate</DrillDownMenuBack>
              <DrillDownMenuItem>0.25</DrillDownMenuItem>
              <DrillDownMenuItem>0.5</DrillDownMenuItem>
              <DrillDownMenuItem>0.75</DrillDownMenuItem>
              <DrillDownMenuItem>Normal</DrillDownMenuItem>
              <DrillDownMenuItem>1.25</DrillDownMenuItem>
              <DrillDownMenuItem>1.5</DrillDownMenuItem>
              <DrillDownMenuItem>1.75</DrillDownMenuItem>
              <DrillDownMenuItem>2</DrillDownMenuItem>
            </DrillDownMenuSubContent>
          </DrillDownMenuSub>
          <DrillDownMenuSub>
            <DrillDownMenuSubTrigger>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <span>Quality</span>
            </DrillDownMenuSubTrigger>
            <DrillDownMenuSubContent>
              <DrillDownMenuBack>Quality</DrillDownMenuBack>
              <DrillDownMenuItem>2160p</DrillDownMenuItem>
              <DrillDownMenuItem>1440p</DrillDownMenuItem>
              <DrillDownMenuItem>1080p</DrillDownMenuItem>
              <DrillDownMenuItem>720p</DrillDownMenuItem>
              <DrillDownMenuItem>480p</DrillDownMenuItem>
              <DrillDownMenuItem>360p</DrillDownMenuItem>
              <DrillDownMenuItem>240p</DrillDownMenuItem>
              <DrillDownMenuItem>144p</DrillDownMenuItem>
              <DrillDownMenuItem>Auto</DrillDownMenuItem>
            </DrillDownMenuSubContent>
          </DrillDownMenuSub>
        </DrillDownMenuGroup>
      </DrillDownMenuContent>
    </DrillDownMenu>
  );

  //   return (
  //     <Popover
  //       onOpenChange={(open) => {
  //         if (open) {
  //           UI.openMenu();
  //         } else {
  //           UI.closeMenu();
  //         }
  //       }}
  //     >
  //       <PopoverTrigger
  //         render={
  //           <Button variant="ghost" className="rounded-full size-9">
  //             <Settings className="size-6" />
  //           </Button>
  //         }
  //       />
  //       <PopoverContent
  //         side="top"
  //         sideOffset={15}
  //         className="w-auto overflow-hidden bg-transparent"
  //       >
  //         <DrillDownMenuGroup>
  //           <DrillDownMenuSub>
  //             <DrillDownMenuSubTrigger>
  //               <Gauge className="mr-2 h-4 w-4" />
  //               <span>Playrate</span>
  //             </DrillDownMenuSubTrigger>
  //             <DrillDownMenuSubContent>
  //               <DrillDownMenuBack>Playrate</DrillDownMenuBack>
  //               {/* <DrillDownMenuItem>0.25</DrillDownMenuItem>
  //               <DrillDownMenuItem>0.5</DrillDownMenuItem>
  //               <DrillDownMenuItem>0.75</DrillDownMenuItem>
  //               <DrillDownMenuItem>Normal</DrillDownMenuItem>
  //               <DrillDownMenuItem>1.25</DrillDownMenuItem>
  //               <DrillDownMenuItem>1.5</DrillDownMenuItem>
  //               <DrillDownMenuItem>1.75</DrillDownMenuItem>
  //               <DrillDownMenuItem>2</DrillDownMenuItem> */}
  //             </DrillDownMenuSubContent>
  //           </DrillDownMenuSub>
  //           <DrillDownMenuSub>
  //             <DrillDownMenuSubTrigger>
  //               <SlidersHorizontal className="mr-2 h-4 w-4" />
  //               <span>Quality</span>
  //             </DrillDownMenuSubTrigger>
  //             <DrillDownMenuSubContent>
  //               <DrillDownMenuBack>Quality</DrillDownMenuBack>
  //               {/* <DrillDownMenuItem>2160p</DrillDownMenuItem>
  //               <DrillDownMenuItem>1440p</DrillDownMenuItem>
  //               <DrillDownMenuItem>1080p</DrillDownMenuItem>
  //               <DrillDownMenuItem>720p</DrillDownMenuItem>
  //               <DrillDownMenuItem>480p</DrillDownMenuItem>
  //               <DrillDownMenuItem>360p</DrillDownMenuItem>
  //               <DrillDownMenuItem>240p</DrillDownMenuItem>
  //               <DrillDownMenuItem>144p</DrillDownMenuItem>
  //               <DrillDownMenuItem>Auto</DrillDownMenuItem> */}
  //             </DrillDownMenuSubContent>
  //           </DrillDownMenuSub>
  //         </DrillDownMenuGroup>
  //       </PopoverContent>
  //     </Popover>
  //   );
}

// export function PopoverDemo() {
//   return (
//     <Popover>
//       <PopoverTrigger
//         render={<Button variant="outline">Open popover</Button>}
//       />
//       <PopoverContent side="top" className="w-80">
//         <div className="grid gap-4">
//           <div className="space-y-2">
//             <h4 className="leading-none font-medium">Dimensions</h4>
//             <p className="text-muted-foreground text-sm">
//               Set the dimensions for the layer.
//             </p>
//           </div>
//           <div className="grid gap-2">
//             <div className="grid grid-cols-3 items-center gap-4">
//               <Label htmlFor="width">Width</Label>
//               <Input
//                 id="width"
//                 defaultValue="100%"
//                 className="col-span-2 h-8"
//               />
//             </div>
//             <div className="grid grid-cols-3 items-center gap-4">
//               <Label htmlFor="maxWidth">Max. width</Label>
//               <Input
//                 id="maxWidth"
//                 defaultValue="300px"
//                 className="col-span-2 h-8"
//               />
//             </div>
//             <div className="grid grid-cols-3 items-center gap-4">
//               <Label htmlFor="height">Height</Label>
//               <Input
//                 id="height"
//                 defaultValue="25px"
//                 className="col-span-2 h-8"
//               />
//             </div>
//             <div className="grid grid-cols-3 items-center gap-4">
//               <Label htmlFor="maxHeight">Max. height</Label>
//               <Input
//                 id="maxHeight"
//                 defaultValue="none"
//                 className="col-span-2 h-8"
//               />
//             </div>
//           </div>
//         </div>
//       </PopoverContent>
//     </Popover>
//   );
// }
