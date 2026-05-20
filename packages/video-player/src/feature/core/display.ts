import { createFeature } from "../factory";

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
  getInitialState: (): PublicState => ({
    fullscreen: false,
    pip: false,
  }),
  getInternalInitialState: (): PrivateState => ({
    pipWindow: null,
    containerParent: null,
    containerNextSibling: null,
  }),
  getApi: (ctx) => {
    const togglePiP = async () => {
      const usenew = false; // DEBUG
      if (usenew && "documentPictureInPicture" in window) {
        const internal = ctx.getInternalState();
        const container = ctx.getContainer();
        if (!container) return;

        // opened state
        if (internal.pipWindow) {
          internal.pipWindow.close();
          return;
        }

        // closed state
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 180,
        });

        const onPipClose = () => {
          const internal = ctx.getInternalState();
          const parent = internal.containerParent;
          const nextSibling = internal.containerNextSibling;
          // see if usefull to manually remove listener
          // if (internal.pipWindow && internal.onPipClose) {
          //   internal.pipWindow.removeEventListener(
          //     "pagehide",
          //     internal.onPipClose,
          //   );
          // }
          if (parent) {
            parent.insertBefore(container, nextSibling);
          }
          ctx.setInternalState({
            pipWindow: null,
            containerNextSibling: null,
            containerParent: null,
          });
          ctx.setState({
            pip: false,
          });
        };

        ctx.setInternalState({
          pipWindow,
          containerNextSibling: container.nextSibling,
          containerParent: container.parentElement,
        });
        ctx.setState({ pip: true });

        pipWindow.addEventListener("pagehide", onPipClose);
        pipWindow.document.body.appendChild(container);
      } else {
        const video = ctx.getVideo();
        if (!video) return;
        if (document.pictureInPictureElement === video) {
          document.exitPictureInPicture();
        } else {
          video.requestPictureInPicture();
        }
      }
    };
    const toggleFullscreen = () => {
      const container = ctx.getContainer();
      if (ctx.getState().pip) {
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
      ctx.addContainerEventListener("fullscreenchange", () => {
        ctx.setState({ fullscreen: document.fullscreenElement === container });
      });
    }

    if (video) {
      ctx.addMediaEventListener("enterpictureinpicture", () => {
        ctx.setState({ pip: true });
      });
      ctx.addMediaEventListener("leavepictureinpicture", () => {
        ctx.setState({ pip: false });
      });
    }
  },
});
