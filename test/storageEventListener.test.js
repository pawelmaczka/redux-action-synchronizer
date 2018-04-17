import createStorageEventListener, { storageEventListener } from '../src/storageEventListener';

import {
  ACTION_STORAGE_KEY,
  SYNC_MESSAGE_KEY,
  IS_REMOTE,
} from '../src/constants';

const addEventListener = jest.fn();
const eventListener = jest.fn();
const dispatch = jest.fn();
const store = {
  dispatch,
  test: 'test',
};
const action = {
  type: 'test-action',
  payload: 'test-payload',
};

Object.defineProperty(global, 'addEventListener', {
  value: addEventListener,
});

global.localStorage = {
  getItem: () => JSON.stringify(action),
};

beforeEach(() => {
  addEventListener.mockReset();
  eventListener.mockReset();
  dispatch.mockReset();
});

describe('createStorageEventListener', () => {
  it('creates event listener', () => {
    eventListener.mockReturnValue(() => {}); // eslint-disable-line no-empty-function
    createStorageEventListener(store, eventListener);
    expect(addEventListener.mock.calls.length).toBe(1);
    expect(addEventListener.mock.calls[0].length).toBe(2);
    expect(addEventListener.mock.calls[0][0]).toBe('storage');
    expect(addEventListener.mock.calls[0][1]).toBeInstanceOf(Function);
  });
});

describe('storageEventListener', () => {
  it('dispatches action on changing action id in localStorage', () => {
    const event = {
      key: SYNC_MESSAGE_KEY,
      newValue: 'random-value',
    };

    storageEventListener(store)(event);

    expect(dispatch.mock.calls.length).toBe(1);
    expect(dispatch.mock.calls[0][0]).toEqual({
      ...action,
      [IS_REMOTE]: true,
    });
  });

  it('ignores changing of other items in localStorage', () => {
    const event = {
      key: 'another-key',
      newValue: 'randomvalue',
    };

    storageEventListener(store)(event);

    expect(dispatch.mock.calls.length).toBe(0);
  });
});
