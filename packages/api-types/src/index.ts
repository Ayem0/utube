import { treaty } from "@elysiajs/eden";
import type { Api } from "@repo/api";

type ApiType = ReturnType<typeof treaty<Api>>["api"];
export const api = <T extends {}>(headers?: T): ApiType =>
  treaty<Api>("http://localhost:3001", {
    headers,
    fetch: { credentials: "include" },
  }).api;
