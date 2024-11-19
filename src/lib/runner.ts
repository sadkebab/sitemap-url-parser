type RunOptions<TContext> = {
  before?: () => TContext | Promise<TContext>;
  cleanup?: (ctx: TContext) => void | Promise<void>;
  onError?: (error: Error) => void;
  onInterrupt?: (singal: InterruptSignal) => void;
};

type Handlers = {
  error?: (error: Error) => void;
  interrupt?: (signal: InterruptSignal) => void;
  exit?: (code: number) => void;
};

const handlers: Handlers = {};

process.on("uncaughtException", (error) => {
  if (handlers.error) {
    handlers.error(error);
  } else {
    console.error("Uncaught exception:", error);
    process.exit(1);
  }
});

const interruptSignals = ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"] as const;
type InterruptSignal = (typeof interruptSignals)[number];

interruptSignals.forEach((signal) => {
  process.on(signal, () => {
    if (handlers.interrupt) {
      handlers.interrupt(signal);
    } else {
      process.exit(0);
    }
  });
});

process.on("exit", (code) => {
  if (handlers.exit) {
    handlers.exit(code);
  }
});

export async function run<TContext = undefined>(
  fn: (ctx: TContext) => void | Promise<void>,
  opts: RunOptions<TContext> = {}
) {
  const ctx = opts.before ? await opts.before() : (undefined as TContext);

  if (opts.onError) {
    handlers.error = (err: Error) => {
      opts.onError!(err);
    };
  }

  if (opts.onInterrupt) {
    handlers.interrupt = (signal: InterruptSignal) => {
      opts.onInterrupt!(signal);
    };
  }

  if (opts.cleanup) {
    handlers.exit = (code: number) => {
      opts.cleanup!(ctx);
      process.exit(code);
    };
  }

  try {
    await fn(ctx);
  } catch (error) {
    if (error instanceof Error) {
      if (opts.onError) {
        opts.onError(error);
      }
    } else {
      console.error("Non-error thrown:", error);
    }
  }
}
