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

type HrefParserState = "idle" | "h" | "r" | "e" | "f" | "=" | "read";
export class HrefParser {
  private state: HrefParserState = "idle";
  private buffer: string[] = [];

  private transitions: Map<
    HrefParserState,
    (char: string) => { next: HrefParserState; output: string | undefined }
  > = new Map();

  constructor() {
    this.transitions.set("idle", (char) => {
      if (char === "h") {
        return { next: "h", output: undefined };
      }

      return { next: "idle", output: undefined };
    });

    this.transitions.set("h", (char) => {
      if (char === "r") {
        return { next: "r", output: undefined };
      }
      return { next: "idle", output: undefined };
    });

    this.transitions.set("r", (char) => {
      if (char === "e") {
        return { next: "e", output: undefined };
      }
      return { next: "idle", output: undefined };
    });

    this.transitions.set("e", (char) => {
      if (char === "f") {
        return { next: "f", output: undefined };
      }
      return { next: "idle", output: undefined };
    });

    this.transitions.set("f", (char) => {
      if (char === "=") {
        return { next: "=", output: undefined };
      }
      return { next: "idle", output: undefined };
    });

    this.transitions.set("=", (char) => {
      if (char === '"') {
        return { next: "read", output: undefined };
      }
      return { next: "idle", output: undefined };
    });

    this.transitions.set("read", (char) => {
      if (char === '"') {
        const output = this.buffer.join("");
        this.buffer = [];
        return { next: "idle", output: output };
      }

      this.buffer.push(char);
      return { next: "read", output: undefined };
    });
  }

  next(char: string) {
    const handler = this.transitions.get(this.state);

    if (!handler) {
      throw new Error(`Unknown state: ${this.state}`);
    }

    const { next, output } = handler(char);
    this.state = next;
    return output;
  }
}
