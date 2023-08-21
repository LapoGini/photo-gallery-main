import { createStore } from 'vuex';

export default createStore({
  state: {
    apiToken: null,
  },
  mutations: {
    SET_API_TOKEN(state, apiToken) {
      state.apiToken = apiToken;
    },
  },
  actions: {
    saveApiToken({ commit }, apiToken) {
      commit('SET_API_TOKEN', apiToken);
    }
  },
  getters: {
    getApiToken: state => state.apiToken,
  }
});