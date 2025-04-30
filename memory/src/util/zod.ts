import z from "zod";

/** number hack for hono zod validator query params */
export const nomber = <N extends z.ZodNumber>(number: N) => z.string().pipe(z.coerce.number(number));