import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
  IS_REMOTE,
} from './constants';

export const uuid = () => btoa(`${Date.now()}-${Math.random()}-${Math.random()}`);

export function syncViaLocalStorage(action) {
  localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(action));
  localStorage.setItem(SYNC_MESSAGE_KEY, uuid());
}

export default function createStorageMiddleware({
  whitelist,
  blacklist,
  syncAction = syncViaLocalStorage,
} = {}) {
  return () => next => action => {
    if (!action[IS_REMOTE]) {
      switch (true) {
        case (!blacklist && whitelist && whitelist.includes(action.type)): {
          syncAction(action);
          break;
        }
        case (blacklist && whitelist && whitelist.includes(action.type) && !blacklist.includes(action.type)): {
          syncAction(action);
          break;
        }
        case (!whitelist && blacklist && !blacklist.includes(action.type)): {
          syncAction(action);
          break;
        }
        case (!whitelist && !blacklist): {
          syncAction(action);
          break;
        }
        default: break;
      }
    }
    next(action);
  };
}
