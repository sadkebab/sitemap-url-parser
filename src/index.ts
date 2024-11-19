import { run } from "./lib/runner";
import { args } from "./lib/args";
import { procedures } from "./procedures";
import { match } from "ts-pattern";

run(
  async () => {
    const { action, outputFile } = args();

    await match(action)
      .with("links", () => procedures.links(outputFile))
      .with("products", () => procedures.products(outputFile))
      .exhaustive();

    process.exit(0);
  },
  {
    onError: (e) => {
      console.error(e.message);
      process.exit(1);
    },
  }
);
