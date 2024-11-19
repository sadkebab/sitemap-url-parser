import { z } from "zod";

const EnvSchema = z.object({
  SITEMAP_URL: z.string(),
  PRODUCT_SITEMAP_BASE_URL: z.string(),
  FILTER_BASE_URL: z.string(),
});

export function env() {
  const safeParse = EnvSchema.safeParse(process.env);
  if (!safeParse.success) {
    throw new Error(safeParse.error.errors.map((e) => e.message).join("\n"));
  }
  return safeParse.data;
}
