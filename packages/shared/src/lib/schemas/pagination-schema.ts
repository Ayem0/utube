import z from "zod";

export const paginationQuerySchema = z.object({
  index: z.coerce.number(),
  size: z.coerce
    .number()
    .pipe(z.union([z.literal(10), z.literal(25), z.literal(50)])),
});
