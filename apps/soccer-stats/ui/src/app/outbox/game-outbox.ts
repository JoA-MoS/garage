import { classifySendError } from './classify-send-error';
import type { OutboxStorage } from './outbox-storage';
import type { OutboxAction } from './outbox-types';

/** After this many transient failures in a row, an action needs the user. */
export const MAX_RETRY_ATTEMPTS = 6;
const MAX_BACKOFF_MS = 60_000;

export interface GameOutboxOptions {
  /** `${userId}:${gameId}` */
  scope: string;
  storage: OutboxStorage;
  /** Sends one action (runs its mutation). Resolves once the server applied it. */
  send: (action: OutboxAction) => Promise<void>;
  /** Called with the full list after every change. */
  onChange?: (actions: OutboxAction[]) => void;
  /** False once the user signed out: nothing is read, written or sent. */
  isActive?: () => boolean;
}

/**
 * One game's queue of live actions for one user.
 *
 * Actions are sent strictly in recording order, one at a time: a later
 * action can depend on an earlier one (a swap involving a player subbed in
 * just before), and the server derives state at receipt (period ends
 * snapshot the field). So a failed or backing-off action holds back
 * everything after it.
 */
export class GameOutbox {
  private draining: Promise<void> | undefined;
  /** A sync() arrived during a pass; run another once it ends. */
  private rerun = false;

  constructor(private readonly options: GameOutboxOptions) {}

  async load(): Promise<OutboxAction[]> {
    return this.options.storage.read(this.options.scope);
  }

  /** Resolves once the action is stored on the device - never on network. */
  async enqueue(action: OutboxAction): Promise<void> {
    if (!this.isActive()) {
      throw new Error('Sign in before recording game actions');
    }
    await this.change((actions) => [...actions, action]);
  }

  async retry(actionId: string): Promise<void> {
    await this.change((actions) =>
      actions.map((a) =>
        a.actionId === actionId && a.status === 'failed'
          ? {
              ...a,
              status: 'queued',
              attempts: 0,
              nextAttemptAt: 0,
              error: undefined,
            }
          : a,
      ),
    );
  }

  /** Removes a failed action. Queued ones can't be discarded mid-flight. */
  async discard(actionId: string): Promise<void> {
    await this.change((actions) =>
      actions.filter((a) => a.actionId !== actionId || a.status !== 'failed'),
    );
  }

  /**
   * Sends what it can. Concurrent callers share one drain; a call that
   * arrives mid-pass gets one more pass, since the running one may have read
   * the queue before the caller's action was added.
   */
  sync(now?: number): Promise<void> {
    if (this.draining) {
      this.rerun = true;
      return this.draining;
    }
    this.draining = (async () => {
      do {
        this.rerun = false;
        await this.drain(now ?? Date.now());
      } while (this.rerun);
    })().finally(() => {
      this.draining = undefined;
    });
    return this.draining;
  }

  private async drain(now: number): Promise<void> {
    while (this.isActive()) {
      const [next] = await this.load();
      if (!next || next.status === 'failed' || next.nextAttemptAt > now) {
        return;
      }

      try {
        await this.options.send(next);
        await this.remove(next.actionId);
        continue;
      } catch (error) {
        const failure = classifySendError(error);
        if (failure.kind === 'done') {
          await this.remove(next.actionId);
          continue;
        }
        const attempts = next.attempts + 1;
        const giveUp =
          failure.kind === 'fail' || attempts >= MAX_RETRY_ATTEMPTS;
        await this.change((actions) =>
          actions.map((a) =>
            a.actionId === next.actionId
              ? {
                  ...a,
                  attempts,
                  status: giveUp ? 'failed' : 'queued',
                  nextAttemptAt:
                    now + Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (attempts - 1)),
                  error: failure.message,
                }
              : a,
          ),
        );
        return;
      }
    }
  }

  private async remove(actionId: string): Promise<void> {
    await this.change((actions) =>
      actions.filter((a) => a.actionId !== actionId),
    );
  }

  private async change(
    update: (actions: OutboxAction[]) => OutboxAction[],
  ): Promise<void> {
    if (!this.isActive()) return;
    const actions = await this.options.storage.update(
      this.options.scope,
      update,
    );
    this.options.onChange?.(actions);
  }

  private isActive(): boolean {
    return this.options.isActive?.() ?? true;
  }
}
