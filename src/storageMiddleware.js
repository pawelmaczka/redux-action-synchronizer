import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
  IS_REMOTE,
} from './constants';

export const uuid = () => btoa(`${Date.now()}-${Math.random()}-${Math.random()}`);

export function syncAction(action) {
  localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(action));
  localStorage.setItem(SYNC_MESSAGE_KEY, uuid());
}

export default function createStorageMiddleware(config = {}) {
  const { whitelist, blacklist } = config;

  return () => next => action => {
    if (!action[IS_REMOTE]) {
      if (!!whitelist && whitelist.includes(action.type)) {
        syncAction(action);
      } else if (!!blacklist && !blacklist.includes(action.type)) {
        syncAction(action);
      } else if (!blacklist && !whitelist) {
        syncAction(action);
      }
    }
    next(action);
  };
}
