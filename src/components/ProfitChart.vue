<template>
    <div class="chart-box">
        <trading-vue
            ref="tradingVueProfit"
            :id="id"
            :data="dataCube"
            :overlays="overlays"
            :index-based="true"
            :titleTxt="title"
            :width="width"
            :height="height"
            :color-title="colors.colorTitle"
            :color-back="colors.colorBack"
            :color-grid="colors.colorGrid"
            :color-text="colors.colorText" />
        <div class="scale-box">
            <b-form-select
                size="sm"
                v-model="selectedScale"
                :options="scalesArray"
                @input="updateScale" />
        </div>
    </div>
</template>

<script>
import { TradingVue, DataCube } from "trading-vue-js";
import Square from './Square.vue'
import GBS from './gbs.js'

export default {
    name: "ProfitChart",
    props: [ "id", "allStrikes", "dataChanged", "width", "height" ],
    components: { TradingVue },
    data() {
        return {
            overlays: [ Square ],
            dataCube: new DataCube({
                chart: {},
                onchart: [ {
                    name: "KC",
                    type: "KC",
                    data: [],
                    settings: {
                        length: 20,
                        mult: 2.00,
                        use_tr: true,
                        color: "#2cc6c9ab",
                        backColor: "#2cc6c90a",
                    }, 
                }, {
                    name: "PnL",
                    type: "Square",
                    data: [ ],
                    settings: {
                        dt: 86400000,
                        d$: 250,
                    }
                } ],               
                offchart: [],
            }),
            scalesArray: [
                { value: 5, text: "1H" },
                { value: 6, text: "1D" },
            ],
            selectedScale: 6,
         };
    },
    computed: {
        currentEpoch() { return this.$store.state.candles.currentEpoch; },
        lastPrice() { return this.$store.state.candles.lastPrice; },
        candlesData() { return this.$store.state.candles.candlesData; },
        candlesDataUpdated() { return this.$store.state.candles.candlesDataUpdated; },    
        positions() { return this.$store.state.candles.positions; },
        positionsUpdated() { return this.$store.state.candles.positionsUpdated; },
        title() { return ""; },
        colors() {
            return {  colorBack: "#131722", 
                    colorTitle: "#3EAC7C",
                    colorGrid: "#2F3240",
                    colorText: "#DEDDDD" };
        },
    },
    watch: { 
        candlesDataUpdated(newData, oldData) { this.updateScale(); },
        dataChanged(newData, oldData) { this.updateScale(); },
        positionsUpdated(newData, oldData) { this.updateScale(); },
    },
    methods: {
        updateScale() {
            if (!this.candlesData || !this.candlesData["data"] || 
                !this.candlesData["data"][6]) return;

            this.dataCube.set("chart.data", this.candlesData["data"][this.selectedScale]);
            this.dataCube.set("chart.tf", this.scalesArray[this.selectedScale-5]["text"]);
            this.dataCube.set('onchart.KC.data', this.candlesData["KC"][this.selectedScale]);

            if (!this.positions || this.positions.length === 0 || this.$props.allStrikes.length === 0) {
                this.$refs.tradingVueProfit.resetChart();
                return;    
            }

            const N = 10;
            let payoffEpochs = [];
            let deltaEpoch;
            if (this.selectedScale === 6) {
                deltaEpoch = 1000 * 60 * 60 * 24;
                for (let i = 0; i < N; i++) {
                        payoffEpochs.push(this.getTimeEpoch(this.currentEpoch, "18:50") + 1000 * 60 * 60 * 24 * i);
                }
            } else {
                deltaEpoch = 1000 * 60 * 60;
                for (let i = 0; i < N; i++) {
                        payoffEpochs.push(this.currentEpoch + 1000 * 60 * 60 * i + 1000 * 60 * 60);
                }
            }

            const deltaStrike = parseFloat(this.$props.allStrikes[1]) - parseFloat(this.$props.allStrikes[0]);
            let payoff = new Array(this.$props.allStrikes.length);
            for (let i=0; i<this.$props.allStrikes.length; i++) {
                const x = parseFloat(this.allStrikes[i]);
                
                payoff[i] = new Array(N);
                for (let d=0; d<N; d++) payoff[i][d] = 0;
                for (let j=0; j<this.positions.length; j++) {
                    const position = this.positions[j];
                    if (position['closed']) continue;

                    const res = this.computePayoff(position, x, payoffEpochs);
                    for (let d=0; d<N; d++) payoff[i][d] += res[d];
                }
            }

            let minPNL = payoff[0][0];
            let maxPNL = payoff[0][0];
            for (let i=0; i<this.$props.allStrikes.length; i++) {
                for (let d=0; d<N; d++) {
                    minPNL = Math.min(minPNL, payoff[i][d]);
                    maxPNL = Math.max(maxPNL, payoff[i][d]);
                }
            }
            if (maxPNL === 0) minPNL = Math.abs(minPNL);
            else if (minPNL === 0) minPNL = Math.abs(maxPNL);
            else minPNL = Math.min(Math.abs(minPNL), Math.abs(maxPNL));
            if (minPNL === 0) {
                this.$refs.tradingVueProfit.resetChart();
                return;    
            }

            let pnlData = []
            // cycle over time
            for (let d=0; d<N; d++) {
                const epoch = payoffEpochs[d];
                // cycle over strikes
                for (let i=0; i<this.$props.allStrikes.length; i++) {
                    const x = parseFloat(this.$props.allStrikes[i]);
                    const pnl = payoff[i][d]/minPNL;

                    let c = Math.abs(pnl * 1);
                    if (c > 1) c = 1.0;
                    let color;
                    if (pnl < 0) color = "rgba(229,65,80,"+ c + ")";
                    else if (pnl > 0) color = "rgba(35,167,118,"+ c + ")";
                    else color = "rgba(35,167,118,0)";

                    const label = payoff[i][d];//.toFixed(0) + "[" + (pnl * 100).toFixed(2) + "]";
                    pnlData.push([ epoch, epoch + deltaEpoch, 
                                   x - deltaStrike / 2,
                                   x + deltaStrike / 2,
                                   color, label]);

                }

            }
            
            this.dataCube.set('onchart.PnL.data', pnlData);
            this.$refs.tradingVueProfit.resetChart();
        },
        computePayoff(position, x, times) {
            const K = parseFloat(position['strike']);
            const premium = parseFloat(position['open_price']);
            const quantity = parseFloat(position['quantity']);

            let payoff = new Array(times.length);
            for (let d=0; d<times.length; d++) payoff[d] = 0;

            if (position['call?'] === 'F') {
                const pnl = (x - premium) * (position['buy?'] ? 1 : -1) * quantity;
                for (let d=0; d<times.length; d++) payoff[d] = pnl;
            } else {
                for (let d=0; d<times.length; d++) {
                    const t = (position['expiration'] - times[d]) / (1000 * 60 * 60 * 24 * 365);
                    if (t <= 0) break;
                    const value = GBS.black_76(position['call?'] ? 'c' : 'p', x, K, t, 0, position['greeks'][0])[0];
                    if (position['buy?']) payoff[d] = ( value * (1 - position['spread']) - premium) * quantity;
                    else payoff[d] = ( -value * (1 + position['spread']) + premium) * quantity;
                }
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
    }
};
</script>

<style>
.chart-box {
    position: relative;
    border: 0.5px solid transparent;
}

.scale-box {
    position: absolute;
    top: 10px;
    right: 80px;
}
</style>