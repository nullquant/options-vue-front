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
    </div>
</template>

<script>
import { TradingVue, DataCube } from "trading-vue-js";

export default {
    name: "ProfitChart",
    props: [
        "id",
        "dataChanged",
        "width",
        "height"
    ],
    components: { TradingVue },
    watch: {
        dataChanged(newData, oldData) {
        },
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
                }, ],
                offchart: [],
            })
         };
    },
};
</script>

<style>
.chart-box {
  position: relative;
  border: 0.5px solid transparent;
}
</style>