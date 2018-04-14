import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
} from './constants';

export const eventListener = store => event => {
  if (event.key === SYNC_MESSAGE_KEY && event.newValue) {
    const action = JSON.parse(localStorage.getItem(ACTION_STORAGE_KEY));
    store.dispatch({
      ...action,
      isRemote: true,
    });
  }
};

export default function createEventListener(store) {
  window.addEventListener('storage', eventListener(store));
}
