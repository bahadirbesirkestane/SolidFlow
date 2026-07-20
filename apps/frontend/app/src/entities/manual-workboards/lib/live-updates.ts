const CHANNEL_NAME = "solidflow-manual-workboards";
const STORAGE_KEY = "solidflow-manual-workboards-event";

export type ManualWorkboardLiveEvent = {
  boardId: string;
  changedAt: number;
};

export function emitManualWorkboardLiveEvent(boardId: string) {
  const event: ManualWorkboardLiveEvent = {
    boardId,
    changedAt: Date.now(),
  };

  if (typeof window === "undefined") {
    return;
  }

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(event);
    channel.close();
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
}

export function subscribeManualWorkboardLiveEvents(callback: (event: ManualWorkboardLiveEvent) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let channel: BroadcastChannel | null = null;
  const handleStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key !== STORAGE_KEY || !storageEvent.newValue) {
      return;
    }

    try {
      callback(JSON.parse(storageEvent.newValue));
    } catch {
      // Bos gec.
    }
  };

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", (messageEvent) => {
      callback(messageEvent.data as ManualWorkboardLiveEvent);
    });
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener("storage", handleStorage);
    channel?.close();
  };
}
