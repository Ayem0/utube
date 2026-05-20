import Hls from "hls.js";
import { Engine, EngineDefaultState } from "./engine";
import { HlsEngine } from "./hls-engine";

export function createEngine(defaultState: EngineDefaultState): Engine {
  if (Hls.isSupported()) {
    return new HlsEngine(defaultState);
  } else {
    throw new Error("Engine not found");
  }
}
