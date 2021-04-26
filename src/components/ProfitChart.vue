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
    </div>
</template>

<script>
import { TradingVue, DataCube } from "trading-vue-js";
import Square from './Square.vue'

export default {
    name: "ProfitChart",
    props: [ "id", "payoffData", "payoffEpochs", "dataChanged", "width", "height" ],
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
            })
         };
    },
    computed: {
        candlesData() { return this.$store.state.candles.candlesData; },
        candlesDataUpdated() { return this.$store.state.candles.candlesDataUpdated; },    
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
    },
    methods: {
        updateScale() {
            if (!this.candlesData || !this.candlesData["data"] || 
                !this.candlesData["data"][6]) return;

            this.dataCube.set("chart.data", this.candlesData["data"][6]);
            this.dataCube.set("chart.tf", "1D");
            this.dataCube.set('onchart.KC.data', this.candlesData["KC"][6]);

            if (!this.$props.payoffData || this.$props.payoffData.length < 2) {
                this.$refs.tradingVueProfit.resetChart();
                return;    
            }

            let minp = this.$props.payoffData[0][0]['y'];
            let maxp = this.$props.payoffData[0][0]['y'];
            for (let i=0; i<this.$props.payoffData[0].length; i++) {
                minp = Math.min(minp, this.$props.payoffData[0][i]['y']);
                maxp = Math.max(minp, this.$props.payoffData[0][i]['y']);
            }
            minp = Math.min(Math.abs(minp), Math.abs(maxp));

            let pnlData = []
            const epoch1850 = 18 * 60 * 60 * 1000 + 50 * 60 * 1000;
            const epoch24 = 24 * 60 * 60 * 1000;
            // cycle over time
            for (let d=1; d<this.$props.payoffData.length; d++) {
                if (!this.$props.payoffData[d] || !this.$props.payoffData[d].length === 0) break;

                let epoch0 = this.$props.payoffEpochs[d-1] - epoch1850;
                const epoch1 = epoch0 + epoch24;
                if (d === 1) epoch0 = epoch0 + 12 * 60 * 60 * 1000;

                const deltaStrike = this.$props.payoffData[d][1]["x"] - this.$props.payoffData[d][0]["x"];

                // cycle over strikes
                for (let i=0; i<this.$props.payoffData[d].length; i++) {
                    const pnl = this.$props.payoffData[d][i]["y"]/minp;

                    let c = Math.abs(pnl * 2);
                    if (c > 1) c = 1.0;
                    let color;
                    if (pnl < 0) color = "rgba(229,65,80,"+ c + ")";
                    else color = "rgba(35,167,118,"+ c + ")";

                    const label = this.$props.payoffData[d][i]["y"].toFixed(0) + "[" + (pnl * 100).toFixed(2) + "]"
                    pnlData.push([ epoch0, epoch1, 
                                   this.$props.payoffData[d][i]["x"] - deltaStrike / 2,
                                   this.$props.payoffData[d][i]["x"] + deltaStrike / 2,
                                   color, label]);
                }
            }

            console.log(pnlData);

            this.dataCube.set('onchart.PnL.data', pnlData);

            this.$refs.tradingVueProfit.resetChart();
        }
    }
};
</script>

<style>
.chart-box {
    position: relative;
    border: 0.5px solid transparent;
}
</style>