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

export function matchesAnyRegExp(text, regExpArray) {
  const filteredExpressions = regExpArray.filter(element => element instanceof RegExp);

  return filteredExpressions.some(expression => expression.test(text));
}

export default function createStorageMiddleware({
  whitelist,
  blacklist,
  syncAction = syncViaLocalStorage,
} = {}) {
  if (whitelist && !(whitelist instanceof Array)) {
    throw Error('Whitelist must be an array');
  }

  if (blacklist && !(blacklist instanceof Array)) {
    throw Error('Blacklist must be an array');
  }

  if (whitelist && whitelist.some(element => (
    !(typeof element === 'string' || element instanceof RegExp)
  ))) {
    throw new Error('Whitelist array should contain only values of type string or RegExp');
  }

  if (blacklist && blacklist.some(element => (
    !(typeof element === 'string' || element instanceof RegExp)
  ))) {
    throw new Error('Blacklist array should contain only values of type string or RegExp');
  }

  const whitelistHasRegExp = whitelist && whitelist.some(element => element instanceof RegExp);
  const blacklistHasRegExp = blacklist && blacklist.some(element => element instanceof RegExp);


  return () => next => action => {
    if (!action[IS_REMOTE]) {
      switch (true) {
        case (
          !blacklist
            && whitelist
            && (whitelist.includes(action.type) || (
              whitelistHasRegExp && matchesAnyRegExp(action.type, whitelist)
            ))
        ): {
          syncAction(action);
          break;
        }
        case (
          blacklist
            && whitelist
            && (whitelist.includes(action.type) || (
              whitelistHasRegExp && matchesAnyRegExp(action.type, whitelist)
            ))
            && (!blacklist.includes(action.type) && (
              !blacklistHasRegExp || !matchesAnyRegExp(action.type, blacklist)
            ))
        ): {
          syncAction(action);
          break;
        }
        case (
          !whitelist
            && blacklist
            && (!blacklist.includes(action.type) && (
              !blacklistHasRegExp || !matchesAnyRegExp(action.type, blacklist)
            ))
        ): {
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
