import { fetchForHrefs } from "./lib/fetch";

declare var self: Worker;

self.onmessage = async (event: MessageEvent<{ url: string; base: string }>) => {
  const { base, url } = event.data;
  console.log("parsing:", url);
  const unique = new Set<string>();

  for await (const productUrl of fetchForHrefs(url)) {
    if (productUrl.startsWith(base)) {
      unique.add(productUrl);
    }
  }

  console.log(`Parsed ${url} and retrieved ${unique.size} links`);
  postMessage(unique);
};
