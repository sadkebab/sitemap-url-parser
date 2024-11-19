import { XMLParser } from "fast-xml-parser";
import { safeTextFetch } from "./lib/fetch";
import { writeFile } from "node:fs/promises";
import { env } from "./lib/env";

//https://catalog.hifi-filter.com/it-IT/product/SN%2025098/HF050878%20:%20%20:%20%20:%20%20:%20%20:%20V01

type Sitemap = {
  sitemapindex: {
    sitemap: {
      loc: string;
    }[];
  };
};

async function getLinks(outputFile: string) {
  const { SITEMAP_URL, PRODUCT_SITEMAP_BASE_URL, FILTER_BASE_URL } = env();

  const parser = new XMLParser();

  const resp = await safeTextFetch(SITEMAP_URL);

  const map = parser.parse(resp) as Sitemap;

  const productSitemapUrls = map.sitemapindex.sitemap
    .filter((s) => s.loc.startsWith(PRODUCT_SITEMAP_BASE_URL))
    .map((sitemap) => sitemap.loc);

  const result = new Set<string>();

  await Promise.all(
    productSitemapUrls.map((sitemap) =>
      sitemapWorker({
        url: sitemap,
        base: FILTER_BASE_URL,
      }).then((set) => {
        set.forEach((url) => result.add(url));
      })
    )
  );

  await writeFile(outputFile, [...result.entries()].join("\n"));

  console.log("Total:", result.size);
}

function sitemapWorker(options: { url: string; base: string }) {
  return new Promise<Set<string>>((resolve, reject) => {
    try {
      const worker = new Worker(
        new URL("./sitemap-worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      worker.postMessage(options);

      worker.onmessage = (event) => {
        resolve(event.data);
      };
    } catch (e) {
      reject(e);
    }
  });
}

async function getProducts(outputFile: string) {
  // TODO implement
  throw new Error("Not implemented");
}

export const procedures = {
  links: getLinks,
  products: getProducts,
};
