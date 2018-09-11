import '@babel/polyfill';

import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import NoSSR from 'vue-no-ssr';
import { createStore } from '@/store';
import { createRouter } from '@/router';
import ClientEntrypoint from '@/containers/entrypoints/ClientEntrypoint';
import 'normalize.css';

Vue.component('no-ssr', NoSSR);

// Expose a factory function that creates a fresh set of store, router,
// app instances on each call (which is called for each SSR request)

// eslint-disable-next-line
export function createApp({ initialState, extras }) {
  // create externalActions
  const getExtras = () => extras;

  // create store and router instances
  const store = createStore({
    initialState,
    externalActions: { getExtras },
  });
  const router = createRouter({ store });

  // sync the router with the vuex store.
  // this registers `store.state.route`
  sync(store, router);

  // create getRouter action to access router inside store
  const getRouter = () => router;

  store.hotUpdate({
    modules: {
      routerModule: {
        actions: {
          getRouter,
        },
      },
    },
  });

  // create the app instance.
  // here we inject the router, store and ssr context to all child components,
  // making them available everywhere as `this.$router` and `this.$store`.
  const app = new Vue({
    router,
    store,
    render: h => h(ClientEntrypoint),
  });

  // expose the app, the router and the store.
  // note we are not mounting the app here, since bootstrapping will be
  // different depending on whether we are in a browser or on the server.
  return { app, router, store };
}
