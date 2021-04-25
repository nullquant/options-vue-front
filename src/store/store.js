import Vue from 'vue'
import Vuex from 'vuex'

import candles from './candles.js'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

const store = new Vuex.Store({
    modules: {
        candles,
    },
    strict: debug,
}) 

export default store;