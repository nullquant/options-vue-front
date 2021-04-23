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
                            :dataChanged="dataChanged" 
                            @nodata="nodata" 
                            @quantity="changeLeg(0, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <option-card 
                            title="Option #2" 
                            :expirationArray="expirationArray"
                            :prices="optionPrices"
                            :dataChanged="dataChanged"
                            @nodata="nodata"
                            @quantity="changeLeg(1, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <option-card 
                            title="Option #3" 
                            :expirationArray="expirationArray"
                            :prices="optionPrices"
                            :dataChanged="dataChanged"
                            @nodata="nodata" 
                            @quantity="changeLeg(2, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <option-card 
                            title="Option #4" 
                            :expirationArray="expirationArray"
                            :prices="optionPrices"
                            :dataChanged="dataChanged"
                            @nodata="nodata" 
                            @quantity="changeLeg(3, $event)" />
                    </b-col>
                    <b-col class='px-1'> 
                        <option-card title="Futures" /> 
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
                <positions-table
                    :optionPrices="optionPrices"
                    :strategy="strategy"
                    :price="price"
                    :dataChanged="positionsChanged"
                    />
            </div>
        </div>
    </div>
</template>

<script>
import OptionCard from './OptionCard.vue';
import PositionsTable from './PositionsTable.vue';
import Scatter from './LineChart.vue'
import GBS from './gbs.js'

export default {
    name: "OptionStrategy",
    components: { OptionCard, Scatter, PositionsTable },
    emits: ["nodata", "pnl"],
    props: ["expirationArray", "descriptionArray", "currentEpoch", "price", 
            "optionsData", "dataChanged"],
    data() {
        return {
            optionPrices: [],
            allStrikes: [],
            strategy: [[], [], [], [], []],
            positionsChanged: false,
            futuresPrice: 0,
            payoffCurve: {},
            width: window.innerWidth - 320,
            height: (window.innerWidth - 320) * 0.25,
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
        dataChanged(newData, oldData) {
            this.parseOptionData();
        },
    },
    methods: {
        parseOptionData() {
            if (!this.$props.optionsData) {
                this.optionPrices = [];
                return;
            }
            // cycle over all options (by expiration)
            for (let i=0; i<this.$props.optionsData.length; i++) {
                if (!this.$props.optionsData[i]) continue;

                if (this.$props.optionsData[i].length === 0) {
                    this.optionPrices[i] = [[], []];
                    continue;
                }

                let index = this.findIndex(this.$props.optionsData[i], this.$props.currentEpoch);
                if (i==0) this.futuresPrice = this.$props.optionsData[i][index]['asset'];
                const slicedTable = this.$props.optionsData[i][index]['option_table'];
                const table = slicedTable.map(a => Object.assign({}, a));

                let strikeSet = new Set();
                let strikeArray = []
                // cycle over option table rows (strikes)
                for (let x=0; x<table.length; x++) {
                    strikeSet.add(table[x]['strike']);
                    if (x === table.length / 2) 
                        strikeArray.push({html: '<b>'+table[x]['strike']+'</b>', value: x});
                    else strikeArray.push({text: table[x]['strike'], value: x});
                }
                this.allStrikes = Array.from(strikeSet);
                this.allStrikes.sort();
                this.optionPrices[i] = [strikeArray, table, this.$props.price];
            }

            this.positionsChanged = !this.positionsChanged;
        },
        findIndex(data, epoch) {
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
        },
        nodata(payload) {
            this.$emit("nodata", payload);
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

            // payload: expiration index, call?, buy?, strike, price, spread, quantity
            let K, premium, optionTime;
            if (payload.length === 0 || payload[6] === 0) this.strategy[index] = [];
            else {
                K = parseFloat(payload[3]);
                premium = parseFloat(payload[4]);

                const expirationEpoch = this.optionExpirationEpoch(payload[0], this.$props.descriptionArray);
                optionTime = (expirationEpoch - this.currentEpoch) / (1000 * 60 * 60 * 24 * 365);
                let greeks;
                if (premium > GBS.black_76(payload[1] ? 'c' : 'p', this.$props.price, K, optionTime, 0, 0.005)[0]) {
                    const v = GBS.euro_implied_vol_76(payload[1] ? 'c' : 'p', this.$props.price, K, optionTime, 0, premium);
                    greeks = GBS.black_76(payload[1] ? 'c' : 'p', this.$props.price, K, optionTime, 0, v);
                    greeks[0] = v;
                }
                else {
                    greeks = GBS.black_76(payload[1] ? 'c' : 'p', this.$props.price, K, optionTime, 0, 0.005);
                    greeks[0] = 0.005;
                }

                const nameArray = this.$props.descriptionArray[payload[0]][1].split('_');
                const secid = nameArray[0] + payload[3] + (payload[1] ? nameArray[1] : nameArray[2]);

                this.strategy[index] = [secid, ...payload, ...greeks, optionTime * 365];
                this.strategy[index].push((expirationEpoch - this.getTimeEpoch(this.currentEpoch, "18:50")) / (1000 * 60 * 60 * 24 * 365));
            }

            // strategy[0..4] :
            // secid, expiration index, call?, buy?, strike, price, spread, quantity
            // volatility, delta, gamma, theta, vega, rho, dte, t for evening clearings

            let x, payoff, evening, leg, quantity, xz;
            let expirationData = [];
            let eveningData = []
            let expirationZerosData = [];
            let eveningZerosData = [];
            let linePNL = [];
            for (let i=0; i<this.allStrikes.length; i++) {
                x = parseFloat(this.allStrikes[i]);
                payoff = 0;
                evening = 0;
                for (let j=0; j<this.strategy.length; j++) {
                    leg = this.strategy[j];
                    if (leg.length === 0 || leg[7] === 0) continue;

                    K = parseFloat(leg[4]);
                    premium = parseFloat(leg[5]);
                    quantity = parseFloat(leg[7]);

                    if (leg[2]) payoff += ((Math.max(x - K, 0) - premium) * (leg[3] ? 1 : -1)) * quantity;
                    else payoff += (Math.max(K - x, 0) - premium) * (leg[3] ? 1 : -1) * quantity;

                    let value = GBS.black_76(leg[2] ? 'c' : 'p', x, K, leg[15], 0, leg[8])[0];
                    if (leg[3]) evening += ( value * (1 - leg[6]) - premium) * quantity;
                    else evening += ( -value * (1 + leg[6]) + premium) * quantity;
                }

                expirationData.push({x: x, y: payoff});
                eveningData.push({x: x, y: evening});
                linePNL.push([x, evening]);

                if (i > 0 && expirationData[i-1]['y'] * payoff < 0) {
                    xz = (expirationData[i-1]['x'] * payoff - expirationData[i-1]['y'] * x) / 
                         (payoff - expirationData[i-1]['y']);
                    expirationZerosData.push({x: xz, y: 0});
                }

                if (i > 0 && eveningData[i-1]['y'] * evening < 0) {
                    xz = (eveningData[i-1]['x'] * evening - eveningData[i-1]['y'] * x) / 
                         (evening - eveningData[i-1]['y']);
                    eveningZerosData.push({x: xz, y: 0});
                    linePNL.push([xz, 0]);
                }
            }

            this.payoffCurve['datasets'][0]['data'] = expirationData;
            this.payoffCurve['datasets'][1]['data'] = expirationZerosData;
            this.payoffCurve['datasets'][2]['data'] = eveningData;
            this.payoffCurve['datasets'][3]['data'] = eveningZerosData;
            this.positionsChanged = !this.positionsChanged;

            linePNL.sort(function(a,b){ return a[0] < b[0] ? -1 : 1; });
            this.$emit("pnl", linePNL);
        },
        optionExpirationEpoch(selectedOption, optionDescriptionArray) {
            const timezone = new Date(1970, 0, 1).getTime();
            const firstTradingDayEpoch = new Date(optionDescriptionArray[selectedOption][4]).valueOf() + timezone;
            let lastTradingDayEpoch = new Date(optionDescriptionArray[selectedOption][5]).valueOf() + timezone;
            const tradingDays = (lastTradingDayEpoch - firstTradingDayEpoch) /(1000 * 60 * 60 * 24);
            if (tradingDays > 30 && optionDescriptionArray[selectedOption][1].startsWith("Si")) lastTradingDayEpoch += 14 * 60 * 60 * 1000;
            else  lastTradingDayEpoch += 18 * 60 * 60 * 1000 + 50 * 60 * 1000;
            return lastTradingDayEpoch;
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
            this.height = this.width * 0.25;
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
