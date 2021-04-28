import axios from 'axios'
import store from './store';
import GBS from '../components/gbs.js'

const candles = {
    namespaced: true,

    state: () => ({

        // sidebar
        choosenBaseAsset: 'Si',
        choosenFutures: '',
        choosenFuturesDTE: 0,

        choosenDate: '',
        choosenTime: '10:00',
        currentEpoch: 0,
        
        // candles (futures)
        fullData: { "data": [[], [], [], [], [], [], []], 
                        "KC": [[], [], [], [], [], [], []] },
        candlesData: { "data": [[], [], [], [], [], [], []], 
                        "KC": [[], [], [], [], [], [], []] },
        candlesDataUpdated: false,
        lastPrice: 0,

        // option chain
        optionsDescriptionArray: [],
        optionsDescriptionUpdated: false,

        optionsData: [],
        optionsTables: [],
        optionsDataUpdated: 0,

        // historic data
        volatilityData: [],
        ivData: [],

        // positions
        positions: [],
        positionsUpdated: false,
    }),

    // getters
    getters: { },
  
    // actions
    actions: {
        setBaseAsset({commit}, baseAsset) {
            commit('SET_BASE_ASSET', baseAsset);
        },
        setDate({state, commit}, date) {
            commit('SET_DATE', date);
            if (state.choosenDate.length != 0) commit('SET_EPOCH', _getEpoch(state.choosenDate, state.choosenTime));
        },
        setTime({ state, dispatch, commit }, time) {
            commit('SET_TIME', time);
            if (state.choosenDate.length != 0) commit('SET_EPOCH', _getEpoch(state.choosenDate, state.choosenTime));

            const ohlcv = _ohlcvSlice(state.choosenTime, state.fullData);
            commit('SET_CANDLES_DATA', ohlcv[0]);
            commit('SET_LAST_PRICE', ohlcv[1]);

            for (let i=0; i<state.optionsData.length; i++) {
                dispatch("searchOptionIndex", i);
            }
            commit("SET_OPTION_DATA_UPDATED");

            for (let i=0; i<state.positions.length; i++) {
                dispatch("updatePosition", i)
            }
            commit("SET_POSITIONS_UPDATED");
        },
        setFutures({ commit }, futures) {
            commit('SET_FUTURES', futures);
        },

        loadCandles({ state, commit }) {
            const query = "http://localhost:5000/api/v1/futures/candles?sec=" + state.choosenFutures + 
                            "&date=" + state.choosenDate;
            axios.get(query)
            .then((response) => {
                if (response.status === 200) {
                    console.log("Got candles data [" + response.data["data"][0].length + "]");
                    const ohlcv = _ohlcvSlice(state.choosenTime, response.data);
                    commit('SET_FULL_DATA', response.data);
                    commit('SET_CANDLES_DATA', ohlcv[0]);
                    commit('SET_LAST_PRICE', ohlcv[1]);
                } else console.log("Got error: " + response.data);
            })
            .catch((error) => {
                if (error.response) {
                // Request made and server responded
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                // The request was made but no response was received
                    console.log(error.request);
                } else {
                // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                }
            });
        },
        setLastPrice({ commit }, price) {
            commit('SET_LAST_PRICE', price);
        },

        loadOptions({ state, dispatch, commit }) {
            const query = "http://localhost:5000/api/v1/options?date=" + 
                state.choosenDate + "&q=" + state.choosenBaseAsset;
            axios.get(query)
                .then((response) => {
                    if (response.status === 200) {
                        console.log("Got options data [" + response.data.length + "]");
                        commit('SET_OPTION_DESCRIPTION', response.data);
                    } else {
                        console.log("Got error: " + response.data);
                        commit('SET_OPTION_DESCRIPTION', []);
                        dispatch("optionError", 0);
                    }
               /* })
                .catch((error) => {
                    if (error.response) {
                    // Request made and server responded
                        console.log(error.response.data);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                    } else if (error.request) {
                    // The request was made but no response was received
                        console.log(error.request);
                    } else {
                    // Something happened in setting up the request that triggered an Error
                        console.log('Error', error.message);
                    }
                    commit('SET_OPTION_DESCRIPTION', []);
                    dispatch("optionError", 0);*/
                });
        },
        loadOptionTable({ state, dispatch, commit }, selected) {
            if (selected < 0) return;
            // Has data for selected option
            if (state.optionsData[selected]) {
                dispatch("searchOptionIndex", selected);
                commit("SET_OPTION_DATA_UPDATED");
                return;
            } else  {
                const query = "http://localhost:5000/api/v1/options/tables?sec=" + 
                    state.optionsDescriptionArray[selected][1] + "&asset=" + 
                    state.optionsDescriptionArray[selected][3] + "&date=" + 
                    state.choosenDate;
                axios.get(query)
                    .then((response) => {
                        if (response.status != 200) {
                            console.log("Got error: " + response.data);
                            dispatch("optionError", selected);
                        } else {
                            console.log("Got options tables [" + response.data[0].length + "]");
                            commit('SET_VOLATILITY_DATA', response.data[1]);
                            commit('SET_IV_DATA', response.data[2]);
                            commit('SET_OPTION_DATA', [selected, response.data[0]]);
                            dispatch("searchOptionIndex", selected);
                            commit("SET_OPTION_DATA_UPDATED");
                        }
                   /* })
                    .catch((error) => {
                        if (error.response) {
                        // Request made and server responded
                            console.log(error.response.data);
                            console.log(error.response.status);
                            console.log(error.response.headers);
                        } else if (error.request) {
                        // The request was made but no response was received
                            console.log(error.request);
                        } else {
                        // Something happened in setting up the request that triggered an Error
                            console.log('Error', error.message);
                        }
                        dispatch("optionError", selected);*/
                    });
            }
        },
        searchOptionIndex({ state, commit }, selected) {
            if (!state.optionsData[selected] || state.optionsData[selected].length === 0) return;
            const index = _findOptionIndex(state.optionsData[selected], state.currentEpoch);

            const timezone = new Date(1970, 0, 1).getTime();
            const firstTradingEpoch = new Date(state.optionsDescriptionArray[selected][4]).valueOf() + timezone;
            let lastTradingEpoch = new Date(state.optionsDescriptionArray[selected][5]).valueOf() + timezone;
            const tradingDays = (lastTradingEpoch - firstTradingEpoch) /(1000 * 60 * 60 * 24);
            if (tradingDays > 30 && state.choosenBaseAsset.startsWith("Si")) lastTradingEpoch += 14 * 60 * 60 * 1000;
            else  lastTradingEpoch += 18 * 60 * 60 * 1000 + 50 * 60 * 1000;

            commit("SET_OPTION_TABLE", [selected, state.optionsData[selected][index], lastTradingEpoch]);
        },
        optionError({ commit }, selected) {
            commit('SET_VOLATILITY_DATA', []);
            commit('SET_IV_DATA', []);
            commit('SET_OPTION_DATA', [selected, []]);
            commit("SET_OPTION_TABLE", [selected, []]);
            commit("SET_OPTION_DATA_UPDATED");
        },

        addPositions({ state, commit }, newPositions) {
            if (state.positions.length === 0) {
                commit("SET_POSITIONS", newPositions);
                commit("SET_POSITIONS_UPDATED");
                return;
            }

            for (let a=0; a < newPositions.length; a++) {
                let newPosition = newPositions[a];
                for (let i=0; i < state.positions.length; i++) {
                    let oldPosition = state.positions[i];
                    if (oldPosition['closed']) continue;
                    if (newPosition['secid'] != oldPosition['secid']) continue;

                    // same direction
                    // just add new position
                    if (newPosition['buy?'] === oldPosition['buy?']) break;

                    // new quantity <= old quantity
                    // [close | partially close] old position
                    if (newPosition['quantity'] <= oldPosition['quantity']) { 
                        commit("CLOSE_POSITION", [i, newPosition]);
                        newPosition['quantity'] = 0;
                        break;
                    }

                    // new quantity >= old quantity
                    // close old position, continue search
                    commit("CLOSE_POSITION", [i, newPosition]);
                    newPosition['quantity'] -= oldPosition['quantity'];
                }
                if (newPosition['quantity'] > 0) { // add new position
                    commit("ADD_POSITION", newPosition);
                }
            }
            console.log(state.positions);
            commit("SET_POSITIONS_UPDATED");
        },
        updatePosition({ state, commit }, index){
            let position = state.positions[index];
            if (position['closed']) return;

            let greeks, ev, closePrice, pnl;
            if (position['call?'] != 'F') {
                const t = (position['expiration'] - state.currentEpoch) / (1000 * 60 * 60 * 24 * 365);
                const K = position['strike'];
                if (position['open_price'] > GBS.black_76(position['call?'] ? 'c' : 'p', state.lastPrice, K, t, 0, 0.005)[0]) {
                    const v = GBS.euro_implied_vol_76(position['call?'] ? 'c' : 'p',state.lastPrice, K, t, 0, position['open_price']);
                    greeks = GBS.black_76(position['call?'] ? 'c' : 'p', state.lastPrice, K, t, 0, v);
                    greeks[0] = v;
                } else {
                    greeks = GBS.black_76(position['call?'] ? 'c' : 'p', state.lastPrice, K, t, 0, 0.005);
                    greeks[0] = 0.005;
                }
                if (!position['buy?']) {
                    for (let i=1; i<greeks.length; i++) {
                        greeks[i] = - greeks[i];
                    }
                }
                ev = position['open_price'] - (position['call?'] ? 
                        Math.max(0, state.lastPrice - position['strike']) : 
                        Math.max(0, position['strike'] - state.lastPrice));
                if (!position['buy?']) ev = -ev;

                const table = state.optionsTables[position['index']]['option_table'];
                for (let i = 0; i < table.length; i++) {
                    if (table[i]['strike'] === position['strike']) {
                        if (position['call?']) closePrice = position['buy?'] ? table[i]['call_bid'] : table[i]['call_ask'];
                        else closePrice = position['buy?'] ? table[i]['put_bid'] : table[i]['put_ask'];
                        break;
                    }
                }
            } else {
                greeks = [0, 1, 0, 0, 0]
                ev = '';
                closePrice = state.lastPrice;
            }

            if (closePrice.length === 0) pnl = '';
            else {
                pnl = parseFloat(closePrice) - position['open_price'];
                if (!position['buy?']) pnl = -pnl;
            }

            commit('UPDATE_POSITION', [index, greeks, ev, closePrice, pnl]);
        }

    },
    
    // mutations
    mutations: {
        SET_BASE_ASSET(state, baseAsset) {
            state.choosenBaseAsset = baseAsset;
        },
        SET_DATE(state, date) {
            state.choosenDate = date;
        },
        SET_TIME(state, time) {
            console.log("set time "+time);
            state.choosenTime = time;
        },
        SET_EPOCH(state, epoch) {
            state.currentEpoch = epoch;
        },
        SET_FUTURES(state, futures) {
            state.choosenFutures = futures[0];
            state.choosenFuturesDTE = futures[1];
        },
        SET_FULL_DATA(state, data) {
            state.fullData = data;
        },
        SET_CANDLES_DATA(state, data) {
            state.candlesData = data;
            state.candlesDataUpdated = !state.candlesDataUpdated;
        },
        SET_LAST_PRICE(state, price) {
            state.lastPrice = price;
        },

        SET_OPTION_DESCRIPTION(state, data) {
            state.optionsDescriptionArray = data;
            state.optionsDescriptionUpdated = !state.optionsDescriptionUpdated;
        },

        SET_OPTION_DATA(state, args) {
            if (state.optionsDescriptionArray.length === 0) {
                state.optionsData = [];
                return;
            }
            if (state.optionsData.length === 0) {
                state.optionsData = new Array(state.optionsDescriptionArray.length);
            }
            state.optionsData[args[0]] = args[1];
        },
        SET_OPTION_TABLE(state, args) {
            if (state.optionsDescriptionArray.length === 0) {
                state.optionsTables = [];
                return;
            }
            if (state.optionsTables.length === 0) {
                state.optionsTables = new Array(state.optionsDescriptionArray.length);
            }
            state.optionsTables[args[0]] = args[1];
            state.optionsTables[args[0]]['expirationEpoch'] = args[2];
        },
        SET_OPTION_DATA_UPDATED(state) {
            console.log("set option data uppdated");
            state.optionsDataUpdated = state.optionsDataUpdated + 1;
        },

        SET_VOLATILITY_DATA(state, data) {
            if (state.optionsDescriptionArray.length === 0) {
                state.volatilityData = [];
                return;
            }
            if (state.volatilityData.length === 0) {
                state.volatilityData = new Array(state.optionsDescriptionArray.length);
            }
            state.volatilityData = data;
        },
        SET_IV_DATA(state, data) {
            if (state.optionsDescriptionArray.length === 0) {
                state.ivData = [];    
                return;
            }
            if (state.ivData.length === 0) {
                state.ivData = new Array(state.optionsDescriptionArray.length);
            }
            state.ivData = data;
        },

        SET_POSITIONS(state, data) {
            state.positions = data;
        },
        SET_POSITIONS_UPDATED(state) {
            console.log("set positions uppdated");
            state.positionsUpdated = !state.positionsUpdated;
        },
        ADD_POSITION(state, data) {
            state.positions.push(data);
        },
        CLOSE_POSITION(state, args) {
            const index = args[0];
            let closingPosition = args[1];
            
            // full close
            if (state.positions[index]['quantity'] <= closingPosition['quantity']) {
                state.positions[index]['closed']  = true;
                state.positions[index]['close_epoch'] = closingPosition['open_epoch'];
                state.positions[index]['close_price'] = closingPosition['open_price'];
                state.positions[index]['greeks'] = closingPosition['greeks'];
                state.positions[index]['asset_price@close'] = closingPosition['asset_price@open'];
                state.positions[index]['pnl'] = (state.positions[index]['close_price'] - 
                                    state.positions[index]['open_price']) * state.positions[index]['quantity'];
                if (!state.positions[index]['buy?']) state.positions[index]['pnl'] = -state.positions[index]['pnl'];
            } else { // partial close
                let position = {
                    'secid': state.positions[index]['secid'],
                    'index': state.positions[index]['index'],
                    'expiration': state.positions[index]['expiration'],
                    'dte': state.positions[index]['dte'],
                    'call?': state.positions[index]['call'],
                    'buy?': state.positions[index]['buy'],
                    'strike': state.positions[index]['strike'],
                    'open_epoch': state.positions[index]['open_epoch'],
                    'open_price': state.positions[index]['open_price'],
                    'spread': state.positions[index]['spread'],
                    'quantity': closingPosition['quantity'],
                    'asset_price@open': state.positions[index]['asset_price@open'],
                    'closed': true,
                    'close_epoch': closingPosition['open_epoch'],
                    'close_price': closingPosition['open_price'],
                    'greeks': closingPosition['greeks'],
                    'asset_price@close': closingPosition['asset_price@open'],
                    'pnl': (closingPosition['open_price'] - 
                                        state.positions[index]['open_price']) * closingPosition['quantity']
                };
                if (!position['buy?']) position['pnl'] = -position[index]['pnl'];
                state.positions[index]['quantity'] -= closingPosition['quantity'];
                state.posiitons.push(position);
            }
        },
        //commit('UPDATE_POSTION', [index, greeks, ev, closePrice, pnl]);
        UPDATE_POSITION(state, args) {
            const index = args[0];
            state.positions[index]['greeks'] = args[1];
            state.positions[index]['ev'] = args[2];
            state.positions[index]['close_price'] = args[3];
            state.positions[index]['pnl'] = args[4];
        }
    },
}

export default candles;

function _getEpoch(date, time) {
    let jsDate = new Date(date);
    const strArray = time.split(":");
    jsDate.setHours(parseInt(strArray[0]));
    jsDate.setMinutes(parseInt(strArray[1]));
    return jsDate.getTime();
}

function _ohlcvSlice(time, data) {
    const newEpoch = _getUTCTimeEpoch(data, time);
    if (newEpoch < 0) return [{'data': [], 'KC': []}, 0];
    let dataArray = []
    let KCArray = []
    for (let i = 0; i < 6; i++) {
        const index = _findOHLCVIndex(data["data"][i], newEpoch);
        dataArray.push(data["data"][i].slice(0, index))
        KCArray.push(data["KC"][i].slice(0, index))
    }
    const dayLength = data["data"][6].length;
    dataArray.push(data["data"][6].slice(0, dayLength-1));
    KCArray.push(data["KC"][6].slice(0, dayLength-1));

    const min = parseInt(time.split(":")[1]);
    if (min % 3 != 0) dataArray[1].push(_lastCandle(dataArray[0], min % 3));
    if (min % 5 != 0) dataArray[2].push(_lastCandle(dataArray[0], min % 5));
    if (min % 10 != 0) dataArray[3].push(_lastCandle(dataArray[0], min % 10));
    if (min % 30 != 0) dataArray[4].push(_lastCandle(dataArray[0], min % 30));
    if (min != 0) dataArray[5].push(_lastCandle(dataArray[0], min));
    
    const dayStart = _findOHLCVIndex(dataArray[0], _getUTCTimeEpoch(data, "00:00")) + 1;
    dataArray[6].push(_lastCandle(dataArray[0], dataArray[0].length - dayStart));

    return [{ "data": dataArray, "KC": KCArray }, dataArray[0][dataArray[0].length-1][4]];
}

function _lastCandle(data, interval) {
    const length = data.length;
    const i0 = Math.max(length - interval, 0);

    const epoch = data[i0][0];
    const open = data[i0][1];
    const close = data[length-1][4];
    let high = open;
    let low = open;
    let volume = 0;
    for (let i=i0; i<length; i++) {
        high = Math.max(high, data[i][2]);
        low = Math.min(low, data[i][3]);
        volume += data[i][5];
    }
    return [epoch, open, high, low, close, volume];
}

function _getUTCTimeEpoch(data, newTime) {
    if (data["data"][0].length === 0) return -1;
    const lastEpoch = data["data"][0][data["data"][0].length-1][0];
    const lastDate = new Date(lastEpoch);
    const strArray = newTime.split(":");
    lastDate.setUTCHours(parseInt(strArray[0]));
    lastDate.setUTCMinutes(parseInt(strArray[1]));
    return lastDate.valueOf();
}

function _findOHLCVIndex(data, epoch) {
    let low = 0;
    let high = data.length;
    if (data[low][0] >= epoch) return low;
    let index = Math.floor((low + high) / 2);
    while(high - low > 1) {
        if (data[index][0] === epoch) return index;
        if (data[index][0] < epoch) low = index;
        else high = index;
        index = Math.floor((low + high) / 2);
    }
    if (data[high][0] === epoch) return high; 
    return low;
}

function _searchOptionIndex(data, oldIndex, epoch) {
    const maxIndex = data.length - 1;
    console.log(oldIndex);
    console.log(data);
    if ((epoch >= data[oldIndex]["epoch"]) && 
        (epoch < data[Math.min(oldIndex + 1, maxIndex)]["epoch"])) {
            return oldIndex;
    } else 
    if ((epoch >= data[Math.min(oldIndex + 1, maxIndex)]["epoch"]) && 
        (epoch < data[Math.min(oldIndex + 2, maxIndex)]["epoch"])) {
            return Math.min(oldIndex + 1, maxIndex);
    } else return _findOptionIndex(data, epoch);
}

function _findOptionIndex(data, epoch) {
    let low = 0;
    let high = data.length;
    if (data[low]["epoch"] >= epoch) return low;
    let index = Math.floor((low + high) / 2);
    while(high - low > 1) {
        if (data[index]["epoch"] === epoch) return index;
        if (data[index]["epoch"] < epoch) low = index;
        else high = index;
        index = Math.floor((low + high) / 2);
    }
    if (data[high]["epoch"] === epoch) return high; 
    return low;
}
