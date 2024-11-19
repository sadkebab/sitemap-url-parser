export function safeTextFetch(url: string, init?: RequestInit) {
  return new Promise<string>((resolve, reject) =>
    fetch(url, init).then(async (res) => {
      if (!res.ok) {
        reject(new Error(`Failed to fetch ${url}: ${res.status}`));
      }
      const text = await res.text();
      resolve(text);
    })
  );
}

export async function* fetchForHrefs(
  url: string,

  init?: RequestInit
) {
  const response = await fetch(url, init);
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not a stream");
  }

  const decoder = new TextDecoder();
  const parser = new HrefParser();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const decoded = decoder.decode(value);
    for (const char of decoded) {
      const url = parser.next(char);

      if (url) {
        yield url;
      }
    }
  }

  return true;
}

export class HrefParser {
  status: "idle" | "h" | "r" | "e" | "f" | "=" | "read" = "idle";
  buffer: string[] = [];
  next(char: string) {
    switch (this.status) {
      case "idle":
        if (char === "h") {
          this.status = "h";
        }
        return undefined;
      case "h":
        if (char === "r") {
          this.status = "r";
        } else {
          this.status = "idle";
        }
        return undefined;
      case "r":
        if (char === "e") {
          this.status = "e";
        } else {
          this.status = "idle";
        }
        return undefined;
      case "e":
        if (char === "f") {
          this.status = "f";
        } else {
          this.status = "idle";
        }
        return undefined;
      case "f":
        if (char === "=") {
          this.status = "=";
        } else {
          this.status = "idle";
        }
        return undefined;
      case "=":
        if (char === '"') {
          this.status = "read";
        } else {
          this.status = "idle";
        }
        return undefined;
      case "read":
        if (char === '"') {
          this.status = "idle";
          const value = this.buffer.join("");
          this.buffer = [];
          return value;
        }

        this.buffer.push(char);
        return undefined;
      default:
        throw new Error("Invalid state");
    }
  }
}
