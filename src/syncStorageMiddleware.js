import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
} from './constants';

function uuid() {
  return btoa(Date.now() + Math.random());
}

function syncAction(action) {
  localStorage.setItem(ACTION_STORAGE_KEY, JSON.stringify(action));
  localStorage.setItem(SYNC_MESSAGE_KEY, uuid());
}

export default function storageMiddleware(config = {}) {
  const { whitelist, blacklist } = config;

  return () => next => action => {
    if (!action.isRemote) {
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
