import { Cache } from "drizzle-orm/cache/core";

export class CustomCache extends Cache {
  override strategy(): "explicit" | "all" {
    return "explicit";
  }
  override async get() {
    return [];
  }
  override async put() {
    return;
  }
  override async onMutate() {
    return;
  }
}
