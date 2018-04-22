import createStorageMiddleware, {
  uuid,
  syncViaLocalStorage,
  matchesAnyRegExp,
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

describe('matchesAnyRegExp', () => {
  it('returns false if there is no RegExp in array', () => {
    expect(matchesAnyRegExp('test', ['test', 1, [2]])).toBe(false);
  });

  it('returns true if string matches any of RegExps', () => {
    expect(matchesAnyRegExp('test1111', [/.+st[1-3]{1,5}$/])).toBe(true);
    expect(matchesAnyRegExp('test1111', [
      '222',
      /.+st[1-3]{1,5}$/,
      /.?2222/,
    ])).toBe(true);
  });

  it('returns false if string does not match any of RegExps', () => {
    expect(matchesAnyRegExp('test111122', [
      '222',
      /.+st[1-3]{1,5}$/,
      /.?2222/,
    ])).toBe(false);
  });
});

describe('createStorageMiddleware', () => {
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

  it('does not synchronize blacklisted action if it is also on the whitelist', () => {
    const blacklistedAction = {
      type: 'blacklistedAction',
      payload: 'blacklistedPayload',
    };
    const whitelistedAction = {
      type: 'whitelistedAction',
      payload: 'whitelistedPayload',
    };
    const whitelistedAndBlacklistedAction = {
      type: 'test-whitelistedAndBlacklistedAction',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      whitelist: [whitelistedAndBlacklistedAction.type, whitelistedAction.type],
      blacklist: [blacklistedAction.type, whitelistedAndBlacklistedAction.type],
    })()(next);

    middleware(blacklistedAction);
    middleware(whitelistedAndBlacklistedAction);
    middleware(whitelistedAction);
    expect(syncAction.mock.calls.length).toBe(1);
    expect(syncAction.mock.calls[0][0]).toBe(whitelistedAction);
  });

  it('does not synchronize action not included in whitelist if there are both whitelist and blacklist specified', () => {
    const action = {
      type: 'action',
      payload: 'payload',
    };
    const whitelistedAction = {
      type: 'whitelistedAction',
      payload: 'whitelistedPayload',
    };
    const blacklistedAction = {
      type: 'blacklistedAction',
      payload: 'payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      whitelist: [whitelistedAction.type],
      blacklist: [blacklistedAction.type],
    })()(next);

    middleware(action);
    middleware(whitelistedAction);
    middleware(blacklistedAction);
    expect(syncAction.mock.calls.length).toBe(1);
    expect(syncAction.mock.calls[0][0]).toBe(whitelistedAction);
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
    expect(syncAction.mock.calls.length).toBe(0);
  });

  it('synchronizes actions that are whitelisted by RegExp', () => {
    const action1 = {
      type: 'action1',
      payload: 'payload-1',
    };
    const action2 = {
      type: 'superTest5',
      payload: 'action-2',
    };
    const action3 = {
      type: 'action3',
      payload: 'test-payload',
    };
    const action4 = {
      type: 'test-action',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      whitelist: [/(action|super).*[0-5]{1}/, 'action3'],
    })()(next);

    middleware(action1);
    middleware(action2);
    middleware(action3);
    middleware(action4);
    expect(syncAction.mock.calls.length).toBe(3);
    expect(syncAction.mock.calls[0][0]).toBe(action1);
    expect(syncAction.mock.calls[1][0]).toBe(action2);
    expect(syncAction.mock.calls[2][0]).toBe(action3);
  });

  it('does not synchronize actions that are blacklisted by RegExp', () => {
    const action1 = {
      type: 'action1',
      payload: 'payload-1',
    };
    const action2 = {
      type: 'superTest5',
      payload: 'action-2',
    };
    const action3 = {
      type: 'action3',
      payload: 'test-payload',
    };
    const action4 = {
      type: 'test-action',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      blacklist: [/(action|super).*[0-5]{1}/],
    })()(next);

    middleware(action1);
    middleware(action2);
    middleware(action3);
    middleware(action4);
    expect(syncAction.mock.calls.length).toBe(1);
    expect(syncAction.mock.calls[0][0]).toBe(action4);
  });

  it('synchronizes actions whitelisted with RegExp but does not synchronize actions blacklisted by RegExp', () => {
    const action1 = {
      type: 'action1',
      payload: 'payload-1',
    };
    const action2 = {
      type: 'superTest5',
      payload: 'action-2',
    };
    const action3 = {
      type: 'action3',
      payload: 'test-payload',
    };
    const action4 = {
      type: 'test-action',
      payload: 'test-payload',
    };

    const middleware = createStorageMiddleware({
      syncAction,
      whitelist: [/(action|super).*[0-5]{1,3}/],
      blacklist: [/super/, 'action3'],
    })()(next);

    middleware(action1);
    middleware(action2);
    middleware(action3);
    middleware(action4);
    expect(syncAction.mock.calls.length).toBe(1);
    expect(syncAction.mock.calls[0][0]).toBe(action1);
  });

  /**
   * Exceptions
   */

  it('throws an exception if provided whitelist is not an array', () => {
    expect(() => createStorageMiddleware({ whitelist: 'test' })).toThrowError('Whitelist must be an array');
  });

  it('throws an exception if provided blacklist is not an array', () => {
    expect(() => createStorageMiddleware({ blacklist: 'test' })).toThrowError('Blacklist must be an array');
  });

  it('throws an exception if whitelist array contains object', () => {
    expect(() => createStorageMiddleware({
      whitelist: [{}],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware(
      { whitelist: [{}, 'test'] })
    ).toThrowError('Whitelist array must contain only values of type string or RegExp');
  });

  it('throws an exception if whitelist array contains array', () => {
    expect(() => createStorageMiddleware({
      whitelist: [[]],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      whitelist: [[], 'test'],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');
  });

  it('throws an exception if whitelist array contains number', () => {
    expect(() => createStorageMiddleware({
      whitelist: [1],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      whitelist: [1, 'test'],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');
  });

  it('throws an exception if whitelist array contains symbol', () => {
    expect(() => createStorageMiddleware({
      whitelist: [Symbol()],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      whitelist: [Symbol(), 'test'],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');
  });

  it('throws an exception if whitelist array contains bool', () => {
    expect(() => createStorageMiddleware({
      whitelist: [true],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      whitelist: [false],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      whitelist: [false, 'test'],
    })).toThrowError('Whitelist array must contain only values of type string or RegExp');
  });

  it('throws an exception if blacklist array contains object', () => {
    expect(() => createStorageMiddleware({
      blacklist: [{}],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      blacklist: [{}, 'test'],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');
  });

  it('throws an exception if blacklist array contains array', () => {
    expect(() => createStorageMiddleware({
      blacklist: [[]],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      blacklist: [[], 'test'],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');
  });

  it('throws an exception if blacklist array contains number', () => {
    expect(() => createStorageMiddleware({
      blacklist: [1],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      blacklist: [1, 'test'],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');
  });

  it('throws an exception if blacklist array contains symbol', () => {
    expect(() => createStorageMiddleware({
      blacklist: [Symbol()],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      blacklist: [Symbol(), 'test'],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');
  });

  it('throws an exception if blacklist array contains bool', () => {
    expect(() => createStorageMiddleware({
      blacklist: [true],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      blacklist: [false],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');

    expect(() => createStorageMiddleware({
      blacklist: [false, 'test'],
    })).toThrowError('Blacklist array must contain only values of type string or RegExp');
  });

  it('throws an expection if syncAction is not a function', () => {
    expect(() => createStorageMiddleware({
      syncAction: 'test',
    })).toThrowError('syncAction must be a function, received string');

    expect(() => createStorageMiddleware({
      syncAction: { test: 'test' },
    })).toThrowError('syncAction must be a function, received object');

    expect(() => createStorageMiddleware({
      syncAction: 1 ,
    })).toThrowError('syncAction must be a function, received number');
  });

  it('throws an expection if shouldSynchronize is not a function', () => {
    expect(() => createStorageMiddleware({
      shouldSynchronize: 'test',
    })).toThrowError('shouldSynchronize must be a function, received string');

    expect(() => createStorageMiddleware({
      shouldSynchronize: { test: 'test' },
    })).toThrowError('shouldSynchronize must be a function, received object');

    expect(() => createStorageMiddleware({
      shouldSynchronize: 1 ,
    })).toThrowError('shouldSynchronize must be a function, received number');
  });
});
