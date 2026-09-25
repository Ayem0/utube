import { treaty } from "@elysia/eden";
import type { Api } from "@repo/api";

type ApiType = ReturnType<typeof treaty<Api>>["api"];
export const api = <T extends {}>(baseUrl: string, headers?: T): ApiType =>
  treaty<Api>(baseUrl, {
    headers,
    fetch: { credentials: "include" },
  }).api;
