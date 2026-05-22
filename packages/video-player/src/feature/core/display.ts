import { createFeature } from "../feature";

type PublicState = {
  fullscreen: boolean;
  pip: boolean;
};

type PrivateState = {
  pipWindow: Window | null;
  containerParent: HTMLElement | null;
  containerNextSibling: Node | null;
};

export const displayFeature = createFeature({
  name: "display",
  getState: (): PublicState => ({
    fullscreen: false,
    pip: false,
  }),
  getInternalState: (): PrivateState => ({
    pipWindow: null,
    containerParent: null,
    containerNextSibling: null,
  }),
  getApi: (ctx) => {
    const togglePiP = async () => {
      const video = ctx.getVideo();
      if (!video) return;
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    };
    const toggleFullscreen = () => {
      const container = ctx.getContainer();
      if (ctx.state.pip()) {
        togglePiP();
      }
      if (!container) return;

      if (document.fullscreenElement === container) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    };
    return {
      togglePiP,
      toggleFullscreen,
    };
  },
  onMediaAttach: (ctx) => {
    const container = ctx.getContainer();
    const video = ctx.getVideo();
    if (container) {
      ctx.events.container("fullscreenchange", () => {
        ctx.state.fullscreen(document.fullscreenElement === container);
      });
    }

    if (video) {
      ctx.events.video("enterpictureinpicture", () => {
        ctx.state.pip(true);
      });
      ctx.events.video("leavepictureinpicture", () => {
        ctx.state.pip(false);
      });
    }
  },
});
