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

export function validateParams({ whitelist, blacklist, shouldSynchronize, syncAction }) {
  if (whitelist && !(whitelist instanceof Array)) {
    throw Error(`Whitelist must be an array, received ${typeof whitelist}`);
  }

  if (blacklist && !(blacklist instanceof Array)) {
    throw Error(`Blacklist must be an array, received ${typeof blacklist}`);
  }

  if (whitelist && whitelist.some(element => (!(typeof element === 'string' || element instanceof RegExp)))) {
    throw new Error(`Whitelist array must contain only values of type string or RegExp, found ${typeof element}`);
  }

  if (blacklist && blacklist.some(element => (!(typeof element === 'string' || element instanceof RegExp)))) {
    throw new Error(`Blacklist array must contain only values of type string or RegExp, found ${typeof element}`);
  }

  if (syncAction && typeof syncAction !== 'function') {
    throw new Error(`syncAction must be a function, received ${typeof syncAction}`)
  }

  if (shouldSynchronize && typeof shouldSynchronize !== 'function') {
    throw new Error(`shouldSynchronize must be a function, received ${typeof shouldSynchronize}`)
  }
}

export const matchesAnyRegExp = (text, regExpArray) => regExpArray.some(element => (
  element instanceof RegExp && element.test(text)
));

export default function createStorageMiddleware({
  whitelist,
  blacklist,
  shouldSynchronize,
  syncAction = syncViaLocalStorage,
} = {}) {
  validateParams({ whitelist, blacklist, shouldSynchronize, syncAction });

  const whitelistHasRegExp = whitelist && whitelist.some(element => element instanceof RegExp);
  const blacklistHasRegExp = blacklist && blacklist.some(element => element instanceof RegExp);


  return () => next => action => {
    const whitelisted = whitelist && (
      whitelist.includes(action.type) || (whitelistHasRegExp && matchesAnyRegExp(action.type, whitelist))
    );

    const blacklisted = blacklist && (
      blacklist.includes(action.type) || (blacklistHasRegExp && matchesAnyRegExp(action.type, blacklist))
    );

    if (!action[IS_REMOTE]) {
      switch (true) {
        case (!blacklist && whitelisted):
        case (blacklist && whitelisted && !blacklisted):
        case (!whitelist && !blacklisted):
        case (!whitelist && !blacklist):
          syncAction(action);
          break;
        default: break;
      }
    }

    next(action);
  };
}
