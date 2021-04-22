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
            <div :style="{ width:lchart_width + 'px' }">
                <h4> Table </h4>
            </div>
        </div>
    </div>
</template>

<script>
import OptionCard from './OptionCard.vue';
import Scatter from './LineChart.vue'
import GBS from './gbs.js'

export default {
    name: "OptionStrategy",
    components: { OptionCard, Scatter },
    emits: ["nodata", "pnl"],
    props: ["expirationArray", "currentEpoch", "optionsData", "dataChanged"],
    data() {
        return {
            optionPrices: [],
            allStrikes: [],
            portfolio: [[], [], [], [], []],
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
        lchart_width() { return Math.floor(this.width / 2); },
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
                this.optionPrices[i] = [strikeArray, table];
            }
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

            // expiration index, call?, buy?, strike, price, quantity
            this.portfolio[index] = payload;

            this.payoffCurve= { datasets: [{
                    type: 'line',
                    label: 'P&L',
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    data: [],
                    spanGaps: true,
                    pointRadius: 0,
                    lineTension: 0,
            }, {
                    type: 'scatter',
                    label: 'BE points',
                    fill: true,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgb(75, 192, 192)',
                    data: [],
                    radius: 6, 
                    pointStyle: "circle"
            } ]};

            const length = this.allStrikes.length;
            let payoff, x, xz, y, leg, K, premium, quantity;
            let maxy = 0;
            let payoffData = [];
            let zerosData = [];
            let linePNL = [];
            for (let i=0; i<length; i++) {
                x = parseFloat(this.allStrikes[i]);
                payoff = 0;
                for (let j=0; j<this.portfolio.length; j++) {
                    leg = this.portfolio[j];
                    if (leg.length === 0 || leg[5] === 0) continue;

                    K = parseFloat(leg[3]);
                    premium = parseFloat(leg[4]);
                    quantity = parseFloat(leg[5]);
                    
                    if (leg[1]) payoff += ((Math.max(x - K, 0) - premium) * (leg[2] ? 1 : -1)) * quantity;
                    else payoff += (Math.max(K - x, 0) - premium) * (leg[2] ? 1 : -1) * quantity;
                }
                payoffData.push({x: x, y: payoff});
                linePNL.push([x, payoff]);
                maxy = Math.max(maxy, payoff);

                if (i > 0 && payoffData[i-1]['y'] * payoff < 0) {
                    xz = (payoffData[i-1]['x'] * payoff - payoffData[i-1]['y'] * x) / 
                         (payoff - payoffData[i-1]['y']);
                    zerosData.push({x: xz,
                                    y: 0});
                    linePNL.push([xz, 0]);
                }
            }

            this.payoffCurve['datasets'][0]['data'] = payoffData;
            this.payoffCurve['datasets'][1]['data'] = zerosData;

            linePNL.sort(function(a,b){ return a[0] < b[0] ? -1 : 1; });
            this.$emit("pnl", linePNL);

            // calculate all greeks, show in the table

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
  grid-template-columns: 50% 50%;
  background-color: #131722;
}
</style>
