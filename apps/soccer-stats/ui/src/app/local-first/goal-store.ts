import type { GoalState, GoalStore } from './goal-outbox';

/** One record per authenticated user/game; every RMW is a cross-tab IDB transaction. */
export class IndexedGoalStore implements GoalStore {
  private database?: Promise<IDBDatabase>;
  private open(): Promise<IDBDatabase> {
    if (!this.database) {
      this.database = new Promise((resolve, reject) => {
        const request = indexedDB.open('soccer-goal-outbox-v1', 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore('games');
        request.onerror = () => {
          this.database = undefined;
          reject(request.error);
        };
        request.onblocked = () => {
          this.database = undefined;
          reject(
            new Error(
              'Local storage is blocked; close other Soccer Stats tabs',
            ),
          );
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            this.database = undefined;
          };
          resolve(db);
        };
      });
    }
    return this.database;
  }
  async read(scope: string): Promise<GoalState | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('games', 'readonly');
      const request = tx.objectStore('games').get(scope);
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error ?? new Error('Local read aborted'));
    });
  }
  async change(
    scope: string,
    update: (state: GoalState) => GoalState,
  ): Promise<GoalState> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      // Resolve only on transaction completion, never on individual request success.
      const tx = db.transaction('games', 'readwrite', { durability: 'strict' });
      const store = tx.objectStore('games');
      const request = store.get(scope);
      let next: GoalState;
      let failure: unknown;
      request.onsuccess = () => {
        try {
          next = update(request.result ?? { actions: [] });
          store.put(next, scope);
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(next);
      tx.onabort = () =>
        reject(failure ?? tx.error ?? new Error('Local write aborted'));
    });
  }
}
