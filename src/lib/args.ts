import { z } from "zod";

const ArgsSchema = z
  .tuple(
    [
      z.string({
        message: "Runner path is required",
      }),
      z.string({
        message: "Script path is required",
      }),
      z.enum(["links", "products"]),
      z.string({
        message: "Output file is required",
      }),
    ],
    {
      errorMap: (issue, ctx) => {
        if (issue.code === "too_small") {
          return {
            message: `
              Usage:
                bun run src/index.ts links|products outputFile
            `,
          };
        }

        return { message: ctx.defaultError };
      },
    }
  )
  .rest(z.string())
  .transform(([runnerPath, scriptPath, action, outputFile]) => ({
    runnerPath,
    scriptPath,
    action,
    outputFile,
  }));

export function args() {
  const safeParse = ArgsSchema.safeParse(process.argv);
  if (!safeParse.success) {
    throw new Error(safeParse.error.errors.map((e) => e.message).join("\n"));
  }
  return safeParse.data;
}
