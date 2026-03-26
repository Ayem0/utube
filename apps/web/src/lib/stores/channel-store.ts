import type { Channel } from '@repo/shared/lib/types/channel';
import { create } from 'zustand';

interface ChannelStore {
  channels: Channel[];
  selectedChannel: Channel | null;
  setChannels: (channels: Channel[]) => void;
  setSelectecChannel: (channel: Channel) => void;
}

export const channelStore = create<ChannelStore>((set) => ({
  channels: [],
  selectedChannel: null,
  setChannels: (channels: Channel[]) => set({ channels }),
  setSelectecChannel: (channel: Channel) => {
    set({ selectedChannel: channel });
  },
}));
