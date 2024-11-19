import { test, expect, describe } from "bun:test";
import { HrefParser } from "../lib/fetch";

describe("hrefParser", () => {
  test("should extract from a string", async () => {
    const parser = new HrefParser();

    const string = `<a href="https://catalog.hifi-filter.com/it-IT/product/SN%2025098/HF050878%20:%20%20:%20%20:%20%20:%20%20:%20V01">`;
    const ulrs = [] as string[];
    for (const s of string) {
      const url = parser.next(s);
      if (url) {
        ulrs.push(url);
      }
    }

    expect(ulrs[0]).toEqual(
      "https://catalog.hifi-filter.com/it-IT/product/SN%2025098/HF050878%20:%20%20:%20%20:%20%20:%20%20:%20V01"
    );
  });
  test("should extract from a string with partitioned string", async () => {
    const parser = new HrefParser();

    const stringPart1 = `<a href="https://catalog.hifi-filter.com/it-IT/product/SN%202509`;
    const stringPart2 = `8/HF050878%20:%20%20:%20%20:%20%20:%20%20:%20V01">`;
    const ulrs = [] as string[];
    for (const s of stringPart1) {
      const url = parser.next(s);
      if (url) {
        ulrs.push(url);
      }
    }
    for (const s of stringPart2) {
      const url = parser.next(s);
      if (url) {
        ulrs.push(url);
      }
    }

    expect(ulrs[0]).toEqual(
      "https://catalog.hifi-filter.com/it-IT/product/SN%2025098/HF050878%20:%20%20:%20%20:%20%20:%20%20:%20V01"
    );
  });
});
