<template>
    <div class="vol-chart" :style="{ height:lchart_height + 'px' }">
        <div :style="{ width:lchart_width + 'px' }">
        <scatter
            :chart-data="volatilityCurveData"
            :options="lineChartSettings"
            :styles="lchart_style" />
        </div>
        <div :style="{ width:lchart_width + 'px' }">
        <scatter
            :chart-data="volatilityHistoryData"
            :options="timeChartSettings"
            :styles="lchart_style" />
        </div>
    </div>
</template>

<script>
import Scatter from './LineChart.vue'
import GBS from './gbs.js'

export default {
    name: "VolatilityCharts",
    components: {
        Scatter,
    },
    props: ["optionsDataIndex", "optionsData", "volatilityData", 
            "optionTime", "dataChanged"],
    data() {
        return {
            volatilityCurveData: {},
            volatilityHistoryData: {},
            width: window.innerWidth - 320,
            height: (window.innerWidth - 320) * 3 / 10,
            lineChartSettings: {
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
                }
            },
            timeChartSettings: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: false },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: { unit: 'day' },
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
                }
            }
        };
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
            this.volatilityCurve();
            this.volatilityHistory();
        },
    },
    methods: {
        volatilityCurve() {
            this.volatilityCurveData= { datasets: [{
                    type: 'line',
                    label: 'MOEX Volatility',
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    data: [],
                    spanGaps: true,
                    pointRadius: 0,
                }, {
                    type: 'scatter',
                    label: 'Call Bid volatility',
                    fill: true,
                    borderColor: '#23A776',
                    backgroundColor: '#23A776',
                    data: [],
                    radius: 6, 
                    pointStyle: "triangle"
                }, {
                    type: 'scatter',
                    label: 'Call Ask Volatility',
                    fill: true,
                    borderColor: '#23A776',
                    data: [],
                    radius: 6, 
                    pointStyle: "triangle",
                    rotation: 180
                }, {
                    type: 'scatter',
                    label: 'Put Bid volatility',
                    fill: true,
                    borderColor: '#E54150',
                    backgroundColor: '#E54150',
                    data: [],
                    radius: 6, 
                    pointStyle: "triangle"
                }, {
                    type: 'scatter',
                    label: 'Put Ask Volatility',
                    fill: true,
                    borderColor: '#E54150',
                    data: [],
                    radius: 6, 
                    pointStyle: "triangle",
                    rotation: 180
                } ]};

            if (!this.$props.optionsData || !this.$props.optionsData[this.$props.optionsDataIndex]) return;

            const slicedTable = this.$props.optionsData[this.$props.optionsDataIndex]["option_table"];
            const fs = parseFloat(this.$props.optionsData[this.$props.optionsDataIndex]["asset"]);
            const t = this.$props.optionTime;

            var moexData = [];
            var maxVolatility = 0;
            for (let i=0; i<slicedTable.length; i++) {
                if (slicedTable[i]['call_iv'].length > 0) {
                    moexData.push({x: slicedTable[i]['strike'], y: slicedTable[i]['call_iv']});
                    maxVolatility = Math.max(maxVolatility, parseFloat(slicedTable[i]['call_iv']));
                } else if (slicedTable[i]['put_iv'].length > 0) {
                    moexData.push({x: slicedTable[i]['strike'], y: slicedTable[i]['put_iv']});
                    maxVolatility = Math.max(maxVolatility, parseFloat(slicedTable[i]['put_iv']));
                }
            }

            var callBidData = [];
            var callAskData = [];
            var putBidData = [];
            var putAskData = [];
            var v;
            for (let i=0; i<slicedTable.length; i++) {
                const x = parseFloat(slicedTable[i]['strike'])

                if (slicedTable[i]['call_bid'].length > 0) {
                    const cp = parseFloat(slicedTable[i]['call_bid']);
                    if (cp >= GBS.black_76('c', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('c', fs, x, t, 0, cp);
                    else v = 0.0;
                    v = Math.round(v * 10000)/100;
                    if (v < maxVolatility * 2) callBidData.push({x: x, y: v});
                }

                if (slicedTable[i]['call_ask'].length > 0) {
                    const cp = parseFloat(slicedTable[i]['call_ask']);
                    if (cp >= GBS.black_76('c', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('c', fs, x, t, 0, cp);
                    else v = 0.0;
                    v = Math.round(v * 10000)/100;
                    if (v < maxVolatility * 2) callAskData.push({x: x, y: v});
                }

                if (slicedTable[i]['put_bid'].length > 0) {
                    const cp = parseFloat(slicedTable[i]['put_bid']);
                    if (cp >= GBS.black_76('p', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('p', fs, x, t, 0, cp);
                    else v = 0.0;
                    v = Math.round(v * 10000)/100;
                    if (v < maxVolatility * 2) putBidData.push({x: x, y: v});
                }

                if (slicedTable[i]['put_ask'].length > 0) {
                    const cp = parseFloat(slicedTable[i]['put_ask']);
                    if (cp >= GBS.black_76('p', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('p', fs, x, t, 0, cp);
                    else v = 0.0;
                    v = Math.round(v * 10000)/100;
                    if (v < maxVolatility * 2) putAskData.push({x: x, y: v});
                }
            }
            this.volatilityCurveData['datasets'][0]['data'] = moexData;
            this.volatilityCurveData['datasets'][1]['data'] = callBidData;
            this.volatilityCurveData['datasets'][2]['data'] = callAskData;
            this.volatilityCurveData['datasets'][3]['data'] = putBidData;
            this.volatilityCurveData['datasets'][4]['data'] = putAskData;
        },
    volatilityHistory() {
        this.volatilityHistoryData = {};
        this.volatilityHistoryData['labels'] = [];
        this.volatilityHistoryData['datasets'] = [ {
                type: 'line',
                label: 'History Volatility',
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                data: [],
                pointRadius: 0,
            }];
        if (!this.$props.volatilityData) return;
        for (let i=0; i<this.$props.volatilityData.length; i++) {
            this.volatilityHistoryData['labels'].push(this.$props.volatilityData[i][0]);
            this.volatilityHistoryData['datasets'][0]['data'].push(this.$props.volatilityData[i][1])
        }
    },
        onResize(event) {
            this.width = window.innerWidth - 320;
            this.height = this.width * 3 / 10;
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
.vol-chart {
  display: grid;
  grid-template-columns: 50% 50%;
  background-color: #131722;
}
</style>