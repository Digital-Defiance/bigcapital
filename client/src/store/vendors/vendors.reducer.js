import { createReducer } from '@reduxjs/toolkit';
import {
  viewPaginationSetReducer,
  createTableQueryReducers,
} from 'store/journalNumber.reducer';

import t from 'store/types';

const initialState = {
  items: {},
  views: {},
  loading: false,
  currentViewId: -1,
  selectedRows: [],
  tableQuery: {
    page_size: 12,
    page: 1,
  },
};
export default createReducer(initialState, {
  [t.VENDOR_SET]: (state, action) => {
    const { id, vendor } = action.payload;
    const _vendors = state.items[id] || {};
    state.items[id] = { ..._vendors, ...vendor };
  },

  [t.VENDORS_TABLE_LOADING]: (state, action) => {
    const { loading } = action.payload;
    state.loading = loading;
  },

  [t.VENDORS_ITEMS_SET]: (state, action) => {
    const { vendors } = action.payload;
    const _vendors = {};

    vendors.forEach((vendor) => {
      _vendors[vendor.id] = {
        ...vendor,
      };
    });
    state.items = {
      ...state.items,
      ..._vendors,
    };
  },

  [t.VENDORS_SET_CURRENT_VIEW]: (state, action) => {
    state.currentViewId = action.currentViewId;
  },

  [t.VENDORS_PAGE_SET]: (state, action) => {
    const { customViewId, vendors, paginationMeta } = action.payload;

    const viewId = customViewId || -1;
    const view = state.views[viewId] || {};

    state.views[viewId] = {
      ...view,
      pages: {
        ...(state.views?.[viewId]?.pages || {}),
        [paginationMeta.page]: {
          ids: vendors.map((i) => i.id),
        },
      },
    };
  },

  [t.VENDOR_DELETE]: (state, action) => {
    const { id } = action.payload;

    if (typeof state.items[id] !== 'undefined') {
      delete state.items[id];
    }
  },

  [t.VENDOR_SELECTED_ROWS_SET]: (state, action) => {
    const { selectedRows } = action.payload;
    state.selectedRows = selectedRows;
  },
  ...viewPaginationSetReducer(t.VENDORS_PAGINATION_SET),
  ...createTableQueryReducers('VENDORS'),
});
