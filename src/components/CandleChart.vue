<template>
    <div class="chart-box">
        <trading-vue
            ref="tradingVue"
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

export default {
    name: "Chartbox",
    props: [ "id", "title", "scale", "width", "height" ],
    components: { TradingVue, },
    data() { 
        return { 
            overlays: [ ],
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
                },],
                offchart: [],
            }),
            scalesArray: [
                { value: 0, text: "1m" },
                { value: 1, text: "3m" },
                { value: 2, text: "5m" },
                { value: 3, text: "10m" },
                { value: 4, text: "30m" },
                { value: 5, text: "1H" },
                { value: 6, text: "1D" },
            ],
            selectedScale: 0,
        };
    },
    computed: {
        candlesData() { return this.$store.state.candles.candlesData; },
        candlesDataUpdated() { return this.$store.state.candles.candlesDataUpdated; },
        colors() { 
            return { colorBack: "#131722", 
                    colorTitle: "#3EAC7C",
                    colorGrid: "#2F3240",
                    colorText: "#DEDDDD"};
        },
    }, 
    watch: { 
        candlesDataUpdated(newData, oldData) { this.updateScale(); },
        pnl(newData, oldData) { this.updateScale(); }
    },
    mounted() { this.selectedScale = this.$props.scale; },
    methods: {
        updateScale() {
            if (!this.candlesData || !this.candlesData["data"] || 
                !this.candlesData["data"][this.selectedScale]) return;

            this.dataCube.set("chart.data", this.candlesData["data"][this.selectedScale]);
            this.dataCube.set("chart.tf", this.scalesArray[this.selectedScale]["text"]);
            this.dataCube.set('onchart.KC.data', this.candlesData["KC"][this.selectedScale])

            /*if (!this.$props.pnl || this.$props.pnl.length < 2) return;

            const length = this.candlesData["data"][this.selectedScale].length;
            if (length < 2) return;
                
            let epoch = this.candlesData["data"][this.selectedScale][length-1][0];
            epoch = 2 * epoch - this.candlesData["data"][this.selectedScale][length-2][0];

            this.dataCube.del('LinePNL');
            
            for (let i=1; i < this.$props.pnl.length; i++) {

                let color = '#ffffff'

                if (this.$props.pnl[i-1][1] === 0 && this.$props.pnl[i][1] === 0) continue;
                if (this.$props.pnl[i-1][1] > 0 || this.$props.pnl[i][1] > 0) color = '#23A776'
                if (this.$props.pnl[i-1][1] < 0 || this.$props.pnl[i][1] < 0) color = '#E54150'

                this.dataCube.add('onchart',{
                    name: "LinePNL",
                    type: "Segment",
                    data: [],
                    settings: {
                        p1: [epoch, this.$props.pnl[i-1][0]],
                        p2: [epoch, this.$props.pnl[i][0]],
                        lineWidth: 3,
                        legend: false,
                        color: color }});
            }*/

            this.$refs.tradingVue.resetChart();
        },
    },
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