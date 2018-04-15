import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
  IS_REMOTE,
} from './constants';

export const storageEventListener = store => event => {
  if (event.key === SYNC_MESSAGE_KEY && event.newValue) {
    const action = JSON.parse(localStorage.getItem(ACTION_STORAGE_KEY));
    store.dispatch({
      ...action,
      [IS_REMOTE]: true,
    });
  }
};

export default function createStorageEventListener(store) {
  window.addEventListener('storage', storageEventListener(store));
}
