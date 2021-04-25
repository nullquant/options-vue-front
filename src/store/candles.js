import axios from 'axios'

const candles = {
    namespaced: true,

    state: () => ({
        choosenBaseAsset: 'Si',
        choosenDate: '',
        choosenTime: '10:00',
        choosenFutures: '',
        fullData: { "data": [[], [], [], [], [], [], []], 
                        "KC": [[], [], [], [], [], [], []] },
        candlesData: { "data": [[], [], [], [], [], [], []], 
                        "KC": [[], [], [], [], [], [], []] },
        candlesDataUpdated: false,
        lastPrice: 0
    }),

    // getters
    getters: { },
  
    // actions
    actions: {
        setBaseAsset({commit}, baseAsset) {
            commit('SET_BASE_ASSET', baseAsset);
        },
        setDate({commit}, date) {
            commit('SET_DATE', date);
        },
        setTime({ state, commit }, time) {
            commit('SET_TIME', time);
            const ohlcv = _ohlcvSlice(state.choosenTime, state.fullData);
            commit('LOAD_CANDLES_DATA', ohlcv[0]);
            commit('SET_LAST_PRICE', ohlcv[1]);
        },
        setFutures({commit}, futures) {
            commit('SET_FUTURES', futures);
        },
        loadCandles({ state, commit }, args) {
            const query =
            "http://localhost:5000/api/v1/futures/candles?sec=" +
            args[0] + "&date=" + args[1];
            axios
            .get(query)
            .then((response) => {
                if (response.status === 200) {
                console.log("Got candles data [" + response.data["data"][0].length + "]");
                const ohlcv = _ohlcvSlice(state.choosenTime, response.data);
                commit('LOAD_FULL_DATA', response.data);
                commit('LOAD_CANDLES_DATA', ohlcv[0]);
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
            state.choosenTime = time;
        },
        SET_FUTURES(state, futures) {
            state.choosenFutures = futures;
        },
        LOAD_FULL_DATA(state, data) {
            state.fullData = data;
        },
        LOAD_CANDLES_DATA(state, data) {
            state.candlesData = data;
            state.candlesDataUpdated = !state.candlesDataUpdated;
        },
        SET_LAST_PRICE(state, price) {
            state.lastPrice = price;
        }
    },
}

export default candles;

function _ohlcvSlice(time, data) {
    const newEpoch = _getTimeEpoch(data, time);
    if (newEpoch < 0) return [{'data': [], 'KC': []}, 0];
    let dataArray = []
    let KCArray = []
    for (let i = 0; i < 6; i++) {
        const index = _findIndex(data["data"][i], newEpoch);
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
    
    const dayStart = _findIndex(dataArray[0], _getTimeEpoch(data, "00:00")) + 1;
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
function _getTimeEpoch(data, newTime) {
    if (data["data"][0].length === 0) return -1;
    const lastEpoch = data["data"][0][data["data"][0].length-1][0];
    const lastDate = new Date(lastEpoch);
    const strArray = newTime.split(":");
    lastDate.setUTCHours(parseInt(strArray[0]));
    lastDate.setUTCMinutes(parseInt(strArray[1]));
    return lastDate.valueOf();
}

function _findIndex(data, epoch) {
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
