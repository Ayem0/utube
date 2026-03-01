import {
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
} from '@repo/ui/drill-down-menu';
import {
  Bell,
  LogOut,
  PaintBucket,
  Settings,
  Shield,
  User,
} from 'lucide-react';

import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';

export function VideoPlayerTest2() {
  return (
    <div className="flex items-center justify-center p-20 bg-gray-100 min-h-[400px]">
      <DrillDownMenu>
        <DrillDownMenuTrigger className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
          Open Settings
        </DrillDownMenuTrigger>
        <DrillDownMenuContent className="w-64 h-[320px]">
          <DrillDownMenuGroup>
            <DrillDownMenuLabel>My Account</DrillDownMenuLabel>
            <DrillDownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DrillDownMenuItem>
            <DrillDownMenuItem>
              <Bell className="mr-2 h-4 w-4" />
              <span>Notifications</span>
            </DrillDownMenuItem>
          </DrillDownMenuGroup>

          <DrillDownMenuSeparator />

          <DrillDownMenuGroup>
            <DrillDownMenuSub>
              <DrillDownMenuSubTrigger>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DrillDownMenuSubTrigger>
              <DrillDownMenuSubContent>
                <DrillDownMenuBack>Main Menu</DrillDownMenuBack>

                <DrillDownMenuGroup>
                  <DrillDownMenuLabel className="mt-2">
                    App Settings
                  </DrillDownMenuLabel>
                  <DrillDownMenuSeparator />

                  <DrillDownMenuItem>
                    <span>General</span>
                  </DrillDownMenuItem>

                  <DrillDownMenuSub>
                    <DrillDownMenuSubTrigger>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Privacy & Security</span>
                    </DrillDownMenuSubTrigger>
                    <DrillDownMenuSubContent>
                      <DrillDownMenuBack>Settings</DrillDownMenuBack>
                      <DrillDownMenuGroup>
                        <DrillDownMenuLabel className="mt-2">
                          Privacy
                        </DrillDownMenuLabel>
                        <DrillDownMenuItem>Login Activity</DrillDownMenuItem>
                        <DrillDownMenuItem>Security Checkup</DrillDownMenuItem>
                      </DrillDownMenuGroup>
                    </DrillDownMenuSubContent>
                  </DrillDownMenuSub>

                  <DrillDownMenuSub>
                    <DrillDownMenuSubTrigger>
                      <PaintBucket className="mr-2 h-4 w-4" />
                      <span>Appearance</span>
                    </DrillDownMenuSubTrigger>
                    <DrillDownMenuSubContent>
                      <DrillDownMenuBack>Settings</DrillDownMenuBack>
                      <DrillDownMenuGroup>
                        <DrillDownMenuLabel className="mt-2">
                          Theme
                        </DrillDownMenuLabel>
                        <DrillDownMenuItem>Light</DrillDownMenuItem>
                        <DrillDownMenuItem>Dark</DrillDownMenuItem>
                        <DrillDownMenuItem>System</DrillDownMenuItem>
                      </DrillDownMenuGroup>
                    </DrillDownMenuSubContent>
                  </DrillDownMenuSub>
                </DrillDownMenuGroup>
              </DrillDownMenuSubContent>
            </DrillDownMenuSub>
          </DrillDownMenuGroup>

          <DrillDownMenuSeparator />

          <DrillDownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DrillDownMenuItem>
        </DrillDownMenuContent>
      </DrillDownMenu>
    </div>
  );
}

('use client');

export function VideoPlayerTest() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline">Open</Button>} />
      <DropdownMenuContent className="w-40" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>
            Profile
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Billing
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            New Team
            <DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>GitHub</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem disabled>API</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
