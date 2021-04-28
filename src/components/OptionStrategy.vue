<template>
    <div class="strategy">
        <div>
            <option-card
                title="Option #1" 
                :expirationArray="expirationArray"
                :prices="optionPrices"
                :dataChanged="tablesChanged"
                :clear="positionExecuted"
                @quantity="changeLeg(0, $event)" />
            <option-card 
                title="Option #2" 
                :expirationArray="expirationArray"
                :prices="optionPrices"
                :dataChanged="tablesChanged"
                :clear="positionExecuted"
                @quantity="changeLeg(1, $event)" />
            <option-card 
                title="Option #3" 
                :expirationArray="expirationArray"
                :prices="optionPrices"
                :dataChanged="tablesChanged"
                :clear="positionExecuted"
                @quantity="changeLeg(2, $event)" />
            <option-card 
                title="Option #4" 
                :expirationArray="expirationArray"
                :prices="optionPrices"
                :dataChanged="tablesChanged"
                :clear="positionExecuted"
                @quantity="changeLeg(3, $event)" />
            <futures-card 
                title="Futures" 
                :clear="positionExecuted"
                @quantity="changeLeg(4, $event)" /> 
        </div>
        <div>
            <div class="strategy-chart" :style="{ height:lchart_height + 'px' }">
                <div :style="{ width:lchart_width + 'px' }">
                    <scatter
                        :chart-data="payoffCurve"
                        :options="chartSettings"
                        :styles="lchart_style" />
                </div>
                <div :style="{ width:ptable_width + 'px' }">
                    <profit-chart
                        id="profit"
                        :allStrikes="allStrikes"
                        :dataChanged="tabChanged"
                        :width="ptable_width"
                        :height="lchart_height"
                    />
                </div>
            </div>
            <div>
                <positions-table
                    :optionPrices="optionPrices"
                    :strategy="strategy"
                    :dataChanged="positionsChanged + tablesChanged"
                    />
            </div>
        </div>
        <div class="close-position-button">
            <b-button @click="closePosition">
                Close Position
            </b-button>
        </div>
        <div class="open-position-button">
            <b-button @click="execute">
                Execute
            </b-button>
        </div>
    </div>
</template>

<script>
import OptionCard from './OptionCard.vue';
import FuturesCard from './FuturesCard.vue';
import PositionsTable from './PositionsTable.vue';
import Scatter from './LineChart.vue'
import ProfitChart from './ProfitChart.vue'
import GBS from './gbs.js'

export default {
    name: "OptionStrategy",
    components: { OptionCard, FuturesCard, Scatter, PositionsTable, ProfitChart },
    props: ["expirationArray", "tabChanged"],
    data() {
        return {
            optionPrices: [],
            allStrikes: [],
            strategy: [[], [], [], [], []],
            tablesChanged: 0,
            positionsChanged: 0,
            positionExecuted: 0,
            payoffCurve: {},
            width: window.innerWidth - 680,
            height: (window.innerWidth - 680) * 0.22,
            chartSettings: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: false },
                scales: {
                    xAxes: [{
                        gridLines: { 
                            display: true,
                            color: "#2F3240",
                            zeroLineColor: "#838383" 
                        },
                        ticks: { 
                            fontColor: "#DEDDDD",
                        },
                    }],
                    yAxes: [{
                        gridLines: {
                            display: true,
                            color: "#2F3240",
                            zeroLineColor: "#838383" 
                        },
                        ticks: { 
                            fontColor: "#DEDDDD",
                            beginAtZero:true 
                        },
                    }]
                },
            },
        }
    },
    computed: {
        lastPrice() { return this.$store.state.candles.lastPrice; },
        currentEpoch() { return this.$store.state.candles.currentEpoch; },
        optionsDescriptionArray() { return this.$store.state.candles.optionsDescriptionArray; },
        optionsDescriptionUpdated() { return this.$store.state.candles.optionsDescriptionUpdated; },
        optionsTables() { return this.$store.state.candles.optionsTables; },
        optionsDataUpdated() { return this.$store.state.candles.optionsDataUpdated; },
        positions() { return this.$store.state.candles.positions; },
        positionsUpdated() { return this.$store.state.candles.positionsUpdated; },
        lchart_style() {
            return {
                height: this.lchart_height + 'px',   
                position: 'relative',
            };
        },
        lchart_width() { return Math.floor(this.width * 0.4); },
        ptable_width() { return Math.floor(this.width * 0.6); },
        lchart_height() { return Math.floor(this.height); },
    },  
    watch: {
        optionsDataUpdated(newData, oldData) { this.parseOptionData(); },
        positionsUpdated(newdata, oldData) { this.payoffUpdate(); }
    },
    methods: {
        parseOptionData() {
            console.log("OS: parseOptionData");
            if (!this.optionsTables || this.optionsTables.length === 0) {
                this.optionPrices = [];
                this.tablesChanged = !this.tablesChanged;
                return;
            }
            // cycle over all options (by expiration)
            this.optionPrices = [];
            for (let i=0; i<this.optionsTables.length; i++) {
                if (!this.optionsTables[i]) continue;

                if (this.optionsTables[i].length === 0) {
                    this.optionPrices[i] = [[], 0];
                    continue;
                }

                const slicedTable = this.optionsTables[i]['option_table'];
                const table = slicedTable.map(a => Object.assign({}, a));

                let strikeSet = new Set();
                for (let x=0; x<table.length; x++) {
                    strikeSet.add(table[x]['strike']);
                }
                this.allStrikes = Array.from(strikeSet);
                this.allStrikes.sort();
                this.optionPrices[i] = [table, this.lastPrice];
            }
            this.tablesChanged += 1;
        },
        changeLeg(index, payload) {
            console.log("OS: changeLeg "+index);
            if (!this.optionsTables || this.optionsTables.length === 0) {
                return;
            }

            // payload: expiration index, call?, buy?, strike, price, spread, quantity
            if (payload.length === 0 || payload[6] === 0) this.strategy[index] = [];
            else {
                if (index === 4) {
                    this.strategy[index] = {
                        'secid': payload[0],
                        'opened': false,
                        'index': 0,
                        'expiration': '',
                        'dte': payload[1],
                        'call?': 'F',
                        'buy?': payload[2],
                        'strike': '',
                        'open_price': payload[4],
                        'spread': 0,
                        'quantity': payload[6],
                        'greeks': [0,1,0,0,0,0],
                        'ev': '',
                        'close_price': this.lastPrice,
                    }
                } else {
                    let K = parseFloat(payload[3]);
                    let premium = parseFloat(payload[4]);

                    const expirationEpoch = this.optionsTables[payload[0]]['expirationEpoch'];
                    const optionTime = (expirationEpoch - this.currentEpoch) / (1000 * 60 * 60 * 24 * 365);
                    let greeks;
                    if (premium > GBS.black_76(payload[1] ? 'c' : 'p', this.lastPrice, K, optionTime, 0, 0.005)[0]) {
                        const v = GBS.euro_implied_vol_76(payload[1] ? 'c' : 'p', this.lastPrice, K, optionTime, 0, premium);
                        greeks = GBS.black_76(payload[1] ? 'c' : 'p', this.lastPrice, K, optionTime, 0, v);
                        greeks[0] = v;
                    }
                    else {
                        greeks = GBS.black_76(payload[1] ? 'c' : 'p', this.lastPrice, K, optionTime, 0, 0.005);
                        greeks[0] = 0.005;
                    }

                    if (!payload[2]) {
                        for (let i=1; i<greeks.length; i++) {
                            greeks[i] = - greeks[i];
                        }
                    }

                    const nameArray = this.optionsDescriptionArray[payload[0]][1].split('_');
                    const secid = nameArray[0] + payload[3] + (payload[1] ? nameArray[1] : nameArray[2]);
                    let ev = payload[4] - (payload[1] ? 
                            Math.max(0, this.lastPrice - payload[3]) : 
                            Math.max(0, payload[3] - this.lastPrice));
                    if (!payload[2]) ev = -ev;

                    let closePrice = '';
                    const table = this.optionPrices[payload[0]][0];
                    for (let i = 0; i < table.length; i++) {
                        if (table[i]['strike'] === payload[3]) {
                            if (payload[1]) closePrice = payload[2] ? table[i]['call_bid'] : table[i]['call_ask'];
                            else closePrice = payload[2] ? table[i]['put_bid'] : table[i]['put_ask'];
                            break;
                        }
                    }

                    // payload: expiration index, call?, buy?, strike, price, spread, quantity
                    this.strategy[index] = { 
                        'secid': secid,
                        'opened': false,
                        'index': payload[0],
                        'expiration': expirationEpoch,
                        'dte': Math.round((expirationEpoch - this.currentEpoch) / (1000 * 60 * 60 * 24)),
                        'call?': payload[1],
                        'buy?': payload[2],
                        'strike': payload[3],
                        'open_price': payload[4],
                        'spread': payload[5],
                        'quantity': payload[6],
                        'greeks': greeks,
                        'ev': ev,
                        'close_price': closePrice
                    }
                }

                let pnl;
                if (this.strategy[index]['close_price'].length === 0) pnl = '';
                else {
                    pnl = parseFloat(this.strategy[index]['close_price']) - this.strategy[index]['open_price'];
                    if (!this.strategy[index]['buy?']) pnl = -pnl;
                }
                this.strategy[index]['pnl'] = pnl;
            }
            this.payoffUpdate();
            this.positionsChanged += 1;
        },
        execute() {
            let position = [];
            let count = 0;
            for (let j=0; j<this.strategy.length; j++) {
                const leg = this.strategy[j];
                if (leg.length === 0 || leg['quantity'] === 0) continue;

                position[count] = {
                    'secid': leg['secid'],
                    'opened': true,
                    'index': leg['index'],
                    'expiration': leg['expiration'],
                    'dte': leg['dte'],
                    'call?': leg['call?'],
                    'buy?': leg['buy?'],
                    'strike': leg['strike'],
                    'open_epoch': this.currentEpoch,
                    'open_price': leg['open_price'],
                    'spread': leg['spread'],
                    'quantity': leg['quantity'],
                    'greeks': leg['greeks'],
                    'asset_price@open': this.lastPrice,
                    'closed': false,

                    'ev': leg['ev'],
                    'close_price': leg['close_price'],
                    'pnl': leg['pnl'],
                };
                count += 1;
            }
            this.$store.dispatch('candles/addPositions', position);
            this.positionExecuted += 1;
        },
        closePosition() {

        },
        payoffUpdate() {
            console.log('OS: payoffUpdate');

            this.payoffCurve= { datasets: [{
                    type: 'line',
                    label: 'P&L @ expiration',
                    fill: false,
                    borderColor: '#4BC0C050',
                    data: [],
                    spanGaps: true,
                    pointRadius: 0,
                    lineTension: 0,
            }, {
                    type: 'scatter',
                    label: 'BE points',
                    fill: true,
                    borderColor: '#4BC0C050',
                    backgroundColor: '#4BC0C050', // #4B98BF
                    data: [],
                    radius: 3, 
                    pointStyle: "circle"
            }, {
                    type: 'line',
                    label: 'P&L @ evening',
                    fill: false,
                    borderColor: '#4BC0C0',
                    data: [],
                    spanGaps: true,
                    pointRadius: 0,
                    lineTension: 0,
            }, {
                    type: 'scatter',
                    label: 'Evening BE points',
                    fill: true,
                    borderColor: '#4BC0C0',
                    backgroundColor: '#4BC0C0',
                    data: [],
                    radius: 3, 
                    pointStyle: "circle"
            } ]};

            const eveningTime = this.getTimeEpoch(this.currentEpoch, "18:50");

            let x, xz;
            let payoffData = new Array(2);
            let payoffZerosData = new Array(2);
            for (let d=0; d<2; d++) {
                payoffData[d] = [];
                payoffZerosData[d] = [];
            }
            for (let i=0; i<this.allStrikes.length; i++) {
                x = parseFloat(this.allStrikes[i]);

                let payoff = [0, 0];
                for (let j=0; j<this.strategy.length; j++) {
                    const position = this.strategy[j];
                    if (position.length === 0 || position['quantity'] === 0) continue;

                    const res = this.computePayoff(position, x, eveningTime);
                    payoff[0] += res[0];
                    payoff[1] += res[1];
                }
                
                for (let j=0; j<this.positions.length; j++) {
                    const position = this.positions[j];
                    if (position['closed']) continue;

                    const res = this.computePayoff(position, x, eveningTime);
                    payoff[0] += res[0];
                    payoff[1] += res[1];
                }

                for (let d=0; d<2; d++) {
                    payoffData[d].push({x: x, y: payoff[d]});

                    if (i > 0 && payoffData[d][i-1]['y'] * payoff[d] < 0) {
                        xz = (payoffData[d][i-1]['x'] * payoff[d] - payoffData[d][i-1]['y'] * x) / 
                            (payoff[d] - payoffData[d][i-1]['y']);
                        payoffZerosData[d].push({x: xz, y: 0});
                    }
                }
            }

            this.payoffCurve['datasets'][0]['data'] = payoffData[0];
            this.payoffCurve['datasets'][1]['data'] = payoffZerosData[0];
            this.payoffCurve['datasets'][2]['data'] = payoffData[1];
            this.payoffCurve['datasets'][3]['data'] = payoffZerosData[1];
        },
        computePayoff(position, x, eveningTime) {
            const K = parseFloat(position['strike']);
            const premium = parseFloat(position['open_price']);
            const quantity = parseFloat(position['quantity']);
            let payoff = [0, 0];

            if (position['call?'] === 'F') {
                const pnl = (x - premium) * (position['buy?'] ? 1 : -1) * quantity;
                payoff[0] = pnl;
                payoff[1] = pnl;
            } else {
                if (position['call?']) payoff[0] += ((Math.max(x - K, 0) - premium) * (position['buy?'] ? 1 : -1)) * quantity;
                else payoff[0] = (Math.max(K - x, 0) - premium) * (position['buy?'] ? 1 : -1) * quantity;

                const t = (position['expiration'] - eveningTime) / (1000 * 60 * 60 * 24 * 365);
                const value = GBS.black_76(position['call?'] ? 'c' : 'p', x, K, t, 0, position['greeks'][0])[0];
                if (position['buy?']) payoff[1] = ( value * (1 - position['spread']) - premium) * quantity;
                else payoff[1] = ( -value * (1 + position['spread']) + premium) * quantity;
            }

            return payoff;
        },
        getTimeEpoch(oldEpoch, newTime) {
            const lastDate = new Date(oldEpoch);
            const strArray = newTime.split(":");
            lastDate.setHours(parseInt(strArray[0]));
            lastDate.setMinutes(parseInt(strArray[1]));
            return lastDate.valueOf();
        },        
        onResize(event) {
            this.width = window.innerWidth - 680;
            this.height = this.width * 0.22;
        },
    },
    mounted() {
        window.addEventListener("resize", this.onResize);
        this.onResize();
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.onResize);
    },
}
</script>

<style>
.strategy {
    position: relative;
    display: grid;
    grid-template-columns: 400px 1fr;
    background-color: #131722;
}

.strategy-chart {
    display: grid;
    grid-template-columns: 40% 60%;
    background-color: #131722;
    margin: 10px 0px 10px 0px;
}

.open-position-button {
    position: absolute;
    top: -45px;
    right: 10px;
}

.close-position-button {
    position: absolute;
    top: 755px;
    left: 135px;
}
</style>
