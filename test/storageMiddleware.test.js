import {
  uuid,
  syncAction,
} from '../src/storageMiddleware';

import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
} from '../src/constants';

const setItem = jest.fn();

global.localStorage = {
  setItem,
};

describe('uuid', () => {
  it('returns unique ids', () => {
    expect(uuid()).not.toBe(uuid());
    expect(uuid()).not.toBe(uuid());
    expect(uuid()).not.toBe(uuid());
  });
});

describe('syncAction', () => {
  it('adds sync action and sync id to localStorage', () => {
    const action = {
      type: 'action-type',
      payload: {
        lib: 'redux-action-synchronizer',
      },
    };

    syncAction(action);

    expect(setItem.mock.calls.length).toBe(2);

    expect(setItem.mock.calls[0][0]).toBe(ACTION_STORAGE_KEY);
    expect(setItem.mock.calls[0][1]).toBe(JSON.stringify(action));

    expect(setItem.mock.calls[1][0]).toBe(SYNC_MESSAGE_KEY);
    expect(setItem.mock.calls[1][1]).toBeDefined();
  });
});
