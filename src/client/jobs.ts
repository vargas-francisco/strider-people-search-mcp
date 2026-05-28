export interface PollOptions<T> {
  jobId: string;
  fetch: (jobId: string) => Promise<T>;
  isDone: (snapshot: T) => boolean;
  isFailed: (snapshot: T) => boolean;
  timeoutMs: number;
  intervalMs: number;
}

export type PollOutcome<T> =
  | { status: 'done'; value: T }
  | { status: 'failed'; value: T }
  | { status: 'timeout'; lastValue?: T };

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export const pollJob = async <T>(opts: PollOptions<T>): Promise<PollOutcome<T>> => {
  const deadline = Date.now() + opts.timeoutMs;
  let last: T | undefined;
  while (Date.now() < deadline) {
    const snapshot = await opts.fetch(opts.jobId);
    last = snapshot;
    if (opts.isDone(snapshot)) return { status: 'done', value: snapshot };
    if (opts.isFailed(snapshot)) return { status: 'failed', value: snapshot };
    await sleep(opts.intervalMs);
  }
  return { status: 'timeout', lastValue: last };
};
