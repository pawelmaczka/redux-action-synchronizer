# redux-action-synchronizer

Redux middleware for synchronizing actions between browsers tabs. It uses localStorage to share dispatched actions and storage event listener to dispatch them in other tabs. By default, it synchronizes all actions but it may be configured to synchronize only selected actions (whitelist) or all actions but not selected ones (blacklist).

Synchronizes properly actions with bigger payloads also on IE11.

## Installation

To install use npm or yarn:

```
npm install --save redux-action-synchronizer

// or

yarn add redux-action-synchronizer
```

## Basic usage

Import `createSyncActionMiddleware` and `createSyncActionEventListener` then create and add `syncActionMiddleware` to the list of redux middleware. After creating redux store pass it to `createSyncActionEventListener` to create event listener that will dispatch synchronized actions to it.

```javascript
import { createSyncActionMiddleware,  createSyncActionEventListener } from 'redux-action-synchronizer'

// creating syncActionMiddleware
const syncActionMiddleware = createSyncActionMiddleware();

// adding syncActionMiddleware to middleware list
const middleware = [
  syncActionMiddleware,
  logger,
  routerMiddleware,
  // other middleware
];

// creating redux store
const store = createStore(
  createReducer(),
  applyMiddleware(...middleware),
);

// creating syncActionEventListener
createSyncActionEventListener(store);
```

## Synchronizing only selected actions

`syncActionMiddleware` is able to synchronize only selected actions. To synchronize only whitelisted actions, pass in to `createSyncActionMiddleware` a config object with whitelist array of action types that should be synchronized. If whitelist is an empty array it will not synchronize any action.

```javascript
const config = {
  whitelist: [
    'SHOW_MESSAGE',
    'HIDE_MESSAGE',
  ],
};

const syncActionMiddleware = createSyncActionMiddleware(config);
```

## Synchronizing all but not selected actions

To synchronize all actions except selected ones pass in to `createSyncActionMiddleware` a config file with blacklist array of action types that should be ignored.

```javascript
const config = {
  blacklist: [
    'API_FETCH_USERS',
    'API_FETCH_ARTICLES',
  ],
};

const syncActionMiddleware = createSyncActionMiddleware(config);
```

Passing both the `whitelist` and `blacklist` will make `syncActionMiddleware` synchronize only actions that are on the whitelist but not on the blacklist.
