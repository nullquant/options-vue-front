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
      :color-text="colors.colorText"
    >
    </trading-vue>
    <div class="scale-box">
      <b-form-select
        size="sm"
        v-model="selectedScale"
        :options="scalesArray"
        @input="updateScale"
      ></b-form-select>
    </div>
  </div>
</template>

<script>
import { TradingVue, DataCube, Channel } from "trading-vue-js";

export default {
  name: "Chartbox",
  props: [
    "id",
    "security",
    "scale",
    "ohlcv",
    "dataChanged",
    "width",
    "height",
    "night",
  ],
  components: {
    TradingVue,
  },
  mounted() {
    this.selectedScale = this.$props.scale;
  },
  methods: {
    updateScale(payload) {
      this.dataCube.set("chart.data", this.$props.ohlcv["data"][this.selectedScale]);
      this.dataCube.set("chart.tf", this.scalesArray[this.selectedScale]["text"]);
      this.dataCube.set('onchart.KC.data', this.$props.ohlcv["KC"][this.selectedScale])
      this.$refs.tradingVue.resetChart();
    },
  },
  watch: {
    dataChanged(newData, oldData) {
      this.updateScale();
    },
  },
  computed: {
    title() {
      return this.$props.security;
    },
    colors() {
      return {  colorBack: "#131722", 
                colorTitle: "#3EAC7C",
                colorGrid: "#2F3240",
                colorText: "#DEDDDD"};
    },
  },
  data() {
    return {
      overlays: Channel,
      dataCube: new DataCube({
        chart: {},
        onchart: [
          {
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
          },
        ],
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
  /*
  // Reset candles
  dc.set('chart.data', ohlcv)

  // Change the entire chart object
  dc.set('chart', {
  type: "Candles",
  data: [ ... ],
  settings: {}
  })  
  */
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