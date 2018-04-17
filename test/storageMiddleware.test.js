import createStorageMiddleware, {
  uuid,
  syncViaLocalStorage,
} from '../src/storageMiddleware';

import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
  IS_REMOTE,
} from '../src/constants';

const setItem = jest.fn();
const next = jest.fn();
const syncAction = jest.fn();

global.localStorage = {
  setItem,
};

beforeEach(() => {
  setItem.mockReset();
  next.mockReset();
  syncAction.mockReset();
});

describe('uuid', () => {
  it('returns unique ids', () => {
    expect(uuid()).not.toBe(uuid());
    expect(uuid()).not.toBe(uuid());
    expect(uuid()).not.toBe(uuid());
  });
});

describe('syncViaLocalStorage', () => {
  it('adds sync action and sync id to localStorage', () => {
    const action = {
      type: 'action-type',
      payload: {
        lib: 'redux-action-synchronizer',
      },
    };

    syncViaLocalStorage(action);

    expect(setItem.mock.calls.length).toBe(2);

    expect(setItem.mock.calls[0][0]).toBe(ACTION_STORAGE_KEY);
    expect(setItem.mock.calls[0][1]).toBe(JSON.stringify(action));

    expect(setItem.mock.calls[1][0]).toBe(SYNC_MESSAGE_KEY);
    expect(setItem.mock.calls[1][1]).toBeDefined(); // random id
  });
});

describe('syncToLocalStorage', () => {
  it('calls next', () => {
    const action = {
      type: 'test-action',
      payload: 'test-payload',
    };

    createStorageMiddleware()()(next)(action);
    expect(next.mock.calls.length).toBe(1);

    next.mockClear();
    createStorageMiddleware()()(next)({
      ...action,
      [IS_REMOTE]: 'true',
    });
    expect(next.mock.calls.length).toBe(1);

    next.mockClear();
    createStorageMiddleware({
      whitelist: [action.type, 'example-action'],
    })()(next)(action);
    expect(next.mock.calls.length).toBe(1);

    next.mockClear();
    createStorageMiddleware({
      blacklist: [action.type, 'example-action'],
    })()(next)(action);
    expect(next.mock.calls.length).toBe(1);

    next.mockClear();
    createStorageMiddleware({
      whitelist: ['example-action'],
      blacklist: [action.type, 'example-action'],
    })()(next)(action);
    expect(next.mock.calls.length).toBe(1);

    next.mockClear();
    createStorageMiddleware({
      whitelist: [action.type, 'example-action'],
      blacklist: ['example-action'],
    })()(next)(action);
    expect(next.mock.calls.length).toBe(1);
  });

  it('synchronizes actions if there is no whitelist and blacklist specified', () => {
    const action1 = {
      type: 'test-action-1',
      payload: 'test-payload-1',
    };
    const action2 = {
      type: 'test-action-2',
      payload: 'test-payload-2',
    };
    const middleware = createStorageMiddleware({ syncAction })()(next);

    middleware(action1);
    expect(syncAction.mock.calls.length).toBe(1);
    expect(syncAction.mock.calls[0][0]).toBe(action1);

    middleware(action2);
    expect(syncAction.mock.calls.length).toBe(2);
    expect(syncAction.mock.calls[0][0]).toBe(action1);
    expect(syncAction.mock.calls[1][0]).toBe(action2);
  });

  it('synchronizes only actions that are on whitelist', () => {
    const whitelistedAction1 = {
      type: 'whitelistedAction-1',
      payload: 'whitelistedPayload-1',
    };
    const whitelistedAction2 = {
      type: 'whitelistedAction-2',
      payload: 'whitelistedPayload-2',
    };
    const action = {
      type: 'test-action',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      whitelist: [whitelistedAction1.type, whitelistedAction2.type],
    })()(next);

    middleware(whitelistedAction1);
    middleware(action);
    middleware(whitelistedAction2);
    expect(syncAction.mock.calls.length).toBe(2);
    expect(syncAction.mock.calls[0][0]).toBe(whitelistedAction1);
    expect(syncAction.mock.calls[1][0]).toBe(whitelistedAction2);
  });

  it('does not synchronize blacklisted actions', () => {
    const blacklistedAction1 = {
      type: 'blacklistedAction-1',
      payload: 'blacklistedPayload-1',
    };
    const blacklistedAction2 = {
      type: 'blacklistedAction-2',
      payload: 'blacklistedPayload-2',
    };
    const action = {
      type: 'test-action',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      blacklist: [blacklistedAction1.type, blacklistedAction2.type],
    })()(next);

    middleware(blacklistedAction1);
    middleware(action);
    middleware(blacklistedAction2);
    expect(syncAction.mock.calls.length).toBe(1);
    expect(syncAction.mock.calls[0][0]).toBe(action);
  });

  it('ignores blacklist if there is whitelist defined', () => {
    const whitelistedAction1 = {
      type: 'whitelistedAction-1',
      payload: 'whitelistedPayload-1',
    };
    const whitelistedAction2 = {
      type: 'whitelistedAction-2',
      payload: 'whitelistedPayload-2',
    };
    const action = {
      type: 'test-action',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      whitelist: [whitelistedAction1.type, whitelistedAction2.type],
      blacklist: [whitelistedAction1.type],
    })()(next);

    middleware(whitelistedAction1);
    middleware(action);
    middleware(whitelistedAction2);
    expect(syncAction.mock.calls.length).toBe(2);
    expect(syncAction.mock.calls[0][0]).toBe(whitelistedAction1);
    expect(syncAction.mock.calls[1][0]).toBe(whitelistedAction2);
  });

  it('does not synchronize anything if whitelist array is empty', () => {
    const action1 = {
      type: 'action-1',
      payload: 'payload-1',
    };
    const action2 = {
      type: 'action-2',
      payload: 'action-2',
    };
    const action = {
      type: 'test-action',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      whitelist: [],
    })()(next);

    middleware(action1);
    middleware(action);
    middleware(action2);
    expect(syncAction.mock.calls.length).toBe(0)
  });
});
