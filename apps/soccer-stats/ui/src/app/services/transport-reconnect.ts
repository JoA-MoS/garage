// Keep transport notifications scoped to the owning Apollo session, never global
// browser events (a disposed account's socket must not wake a new account).
const listeners = new WeakMap<object, Set<() => void>>();

export function onTransportReconnect(client: object, listener: () => void) {
  let callbacks = listeners.get(client);
  if (!callbacks) {
    callbacks = new Set();
    listeners.set(client, callbacks);
  }
  callbacks.add(listener);
  return () => {
    callbacks.delete(listener);
  };
}

export function notifyTransportReconnect(client: object) {
  listeners.get(client)?.forEach((listener) => listener());
}
