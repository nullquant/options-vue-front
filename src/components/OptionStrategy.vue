<template>
    <div>
        <div style="padding: 10px 0px 10px 0px;">
            <b-container fluid>
                <b-row cols=5 class='px-2'>
                    <b-col class='px-1'> 
                        <option-card 
                            title="Option #1" 
                            :expirationArray="expirationArray"
                            :prices="optionPrices"
                            :dataChanged="tablesChanged" 
                            @quantity="changeLeg(0, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <option-card 
                            title="Option #2" 
                            :expirationArray="expirationArray"
                            :prices="optionPrices"
                            :dataChanged="tablesChanged"
                            @quantity="changeLeg(1, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <option-card 
                            title="Option #3" 
                            :expirationArray="expirationArray"
                            :prices="optionPrices"
                            :dataChanged="tablesChanged"
                            @quantity="changeLeg(2, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <option-card 
                            title="Option #4" 
                            :expirationArray="expirationArray"
                            :prices="optionPrices"
                            :dataChanged="tablesChanged"
                            @quantity="changeLeg(3, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <futures-card 
                            title="Futures" 
                            @quantity="changeLeg(4, $event)" /> 
                    </b-col>
                </b-row>
            </b-container>
        </div>
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
                    :payoffData="payoffData"
                    :payoffEpochs="payoffEpochs"
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
                :dataChanged="positionsChanged"
                />
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
            tablesChanged: false,
            positionsChanged: false,
            payoffData: [],
            payoffCurve: {},
            payoffEpochs: [],
            payoffDays: 15,
            width: window.innerWidth - 320,
            height: (window.innerWidth - 320) * 0.20,
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
                annotation: {
                    annotations: [ {
                        drawTime: "afterDatasetsDraw",
                        id: "hline",
                        type: "line",
                        mode: "vertical",
                        scaleID: "x-axis-0",
                        borderColor: "#f00",
                        value: parseFloat("76142"),
                        borderDash: [4, 4],
                        borderWidth: 5,
                    }, ],
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
        optionsDataUpdated(newData, oldData) {
            this.parseOptionData();
        },
    },
    methods: {
        parseOptionData() {
            if (!this.optionsTables || this.optionsTables.length === 0) {
                this.optionPrices = [];
                this.tablesChanged = !this.tablesChanged;
                return;
            }
            // cycle over all options (by expiration)
            for (let i=0; i<this.optionsTables.length; i++) {
                if (!this.optionsTables[i]) continue;

                if (this.optionsTables[i].length === 0) {
                    this.optionPrices[i] = [[], []];
                    continue;
                }

                const slicedTable = this.optionsTables[i]['option_table'];
                const table = slicedTable.map(a => Object.assign({}, a));

                let strikeSet = new Set();
                let strikeArray = []
                // cycle over option table rows (strikes)
                for (let x=0; x<table.length; x++) {
                    strikeSet.add(table[x]['strike']);
                    if (x === table.length / 2) 
                        strikeArray.push({text: table[x]['strike'], value: x});
                    else strikeArray.push({text: table[x]['strike'], value: x});
                }
                this.allStrikes = Array.from(strikeSet);
                this.allStrikes.sort();
                this.optionPrices[i] = [strikeArray, table, this.lastPrice];
            }

            this.payoffEpochs = [];
            const epoch24hours = 1000 * 60 * 60 * 24;
            for (let i = 0; i < this.payoffDays; i++) {
                    this.payoffEpochs.push(this.getTimeEpoch(this.currentEpoch, "18:50") + epoch24hours * i);
            }

            this.tablesChanged = !this.tablesChanged;
        },
        changeLeg(index, payload) {
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

            if (!this.optionsTables || this.optionsTables.length === 0) {
                return;
            }

            // payload: expiration index, call?, buy?, strike, price, spread, quantity
            let K, premium;
            if (payload.length === 0 || payload[6] === 0) this.strategy[index] = [];
            else if (index === 4) {
                this.strategy[index] = [payload[0], 0, 'Futures', payload[2], '', payload[4], 0, payload[6], 
                                        0, 1, 0, 0, 0, 0, payload[1]];
            } else {
                K = parseFloat(payload[3]);
                premium = parseFloat(payload[4]);

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
            
                let times = [];
                for (let i = 0; i < this.payoffDays; i++) {
                    const t = (expirationEpoch - this.payoffEpochs[i]) / (1000 * 60 * 60 * 24 * 365);
                    if (t <= 0) break;
                    times.push(t);
                }

                this.strategy[index] = [secid, ...payload, ...greeks, optionTime * 365, ...times];
            }

            // strategy[0..4] :
            // secid, expiration index, call?, buy?, strike, price, spread, quantity,
            // volatility, delta, gamma, theta, vega, rho, dte, 
            // t for evening clearings, t + 1d, t + 2d, ....

            let x, leg, quantity, xz;
            this.payoffData = new Array(this.payoffDays + 1);
            let payoffZerosData = new Array(this.payoffDays + 1);
            for (let d=0; d<this.payoffDays+1; d++) {
                this.payoffData[d] = [];
                payoffZerosData[d] = [];
            }
            let linePNL = [];
            for (let i=0; i<this.allStrikes.length; i++) {
                x = parseFloat(this.allStrikes[i]);

                let payoff = new Array(this.payoffDays + 1);
                for (let d=0; d<this.payoffDays+1; d++) payoff[d] = 0;

                for (let j=0; j<this.strategy.length; j++) {
                    leg = this.strategy[j];
                    if (leg.length === 0 || leg[7] === 0) continue;

                    K = parseFloat(leg[4]);
                    premium = parseFloat(leg[5]);
                    quantity = parseFloat(leg[7]);

                    if (leg[2]) payoff[0] += ((Math.max(x - K, 0) - premium) * (leg[3] ? 1 : -1)) * quantity;
                    else payoff[0] += (Math.max(K - x, 0) - premium) * (leg[3] ? 1 : -1) * quantity;

                    for (let d=15; d<leg.length; d++) {
                        let value = GBS.black_76(leg[2] ? 'c' : 'p', x, K, leg[d], 0, leg[8])[0];
                        if (leg[3]) payoff[d-14] += ( value * (1 - leg[6]) - premium) * quantity;
                        else payoff[d-14] += ( -value * (1 + leg[6]) + premium) * quantity;
                    }
                }
                
                for (let d=0; d<this.payoffDays+1; d++) {
                    this.payoffData[d].push({x: x, y: payoff[d]});

                    if (i > 0 && this.payoffData[d][i-1]['y'] * payoff[d] < 0) {
                        xz = (this.payoffData[d][i-1]['x'] * payoff[d] - this.payoffData[d][i-1]['y'] * x) / 
                            (payoff[d] - this.payoffData[d][i-1]['y']);
                        payoffZerosData[d].push({x: xz, y: 0});
                    }
                }
                //linePNL.push([x, evening]);
                /*if (i > 0 && eveningData[i-1]['y'] * evening < 0) {
                    xz = (eveningData[i-1]['x'] * evening - eveningData[i-1]['y'] * x) / 
                         (evening - eveningData[i-1]['y']);
                    eveningZerosData.push({x: xz, y: 0});
                    linePNL.push([xz, 0]);
                }*/
            }

            this.payoffCurve['datasets'][0]['data'] = this.payoffData[0];
            this.payoffCurve['datasets'][1]['data'] = payoffZerosData[0];
            this.payoffCurve['datasets'][2]['data'] = this.payoffData[1];
            this.payoffCurve['datasets'][3]['data'] = payoffZerosData[1];
            this.positionsChanged = !this.positionsChanged;
            this.profitChartChanged = !this.profitChartChanged;

            linePNL.sort(function(a,b){ return a[0] < b[0] ? -1 : 1; });
        },
        getTimeEpoch(oldEpoch, newTime) {
            const lastDate = new Date(oldEpoch);
            const strArray = newTime.split(":");
            lastDate.setHours(parseInt(strArray[0]));
            lastDate.setMinutes(parseInt(strArray[1]));
            return lastDate.valueOf();
        },        
        onResize(event) {
            this.width = window.innerWidth - 320;
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
.strategy-chart {
  display: grid;
  grid-template-columns: 40% 60%;
  background-color: #131722;
}
</style>
