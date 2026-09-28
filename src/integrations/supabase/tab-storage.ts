/**
 * Tab-isolated identity helper for client-side storage and Supabase Auth.
 *
 * Ensures each browser tab in the same browser profile maintains its own
 * isolated Supabase session, storage key, and BroadcastChannel.
 * Tab identity is retained across in-tab page navigations and reloads (F5),
 * but isolated across different tabs.
 */

const TAB_NAME_PREFIX = "apex_tab_";
const TAB_STORAGE_KEY_PREFIX = "sb-auth-";

function generateTabId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${TAB_NAME_PREFIX}${rand}_${time}`;
}

export function getTabId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }

  try {
    const currentName = window.name;
    if (currentName && currentName.startsWith(TAB_NAME_PREFIX)) {
      return currentName;
    }

    const newId = generateTabId();
    window.name = newId;
    return newId;
  } catch {
    return "default_tab";
  }
}

export function getTabStorageKey(): string {
  return `${TAB_STORAGE_KEY_PREFIX}${getTabId()}`;
}
