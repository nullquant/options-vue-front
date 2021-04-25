<template>
  <div class="multi-chart">
    <candlechart
      id="1m"
      :security="securityName"
      :scale="0"
      :ohlcv="ohlcv"
      :pnl="pnl"
      :dataChanged="dataChanged"
      :width="cbox_width"
      :height="cbox_height"
    >
    </candlechart>
    <candlechart
      id="H"
      :security="securityName"
      :scale="5"
      :ohlcv="ohlcv"
      :pnl="pnl"
      :dataChanged="dataChanged"
      :width="cbox_width"
      :height="cbox_height"
    >
    </candlechart>
    <candlechart
      id="D"
      :security="securityName"
      :scale="6"
      :ohlcv="ohlcv"
      :pnl="pnl"
      :dataChanged="dataChanged"
      :width="cbox_width"
      :height="cbox_height"
    >
    </candlechart>
  </div>
</template>

<script>
import Candlechart from "./CandleChart.vue";

export default {
  name: "Multichart",
  props: ["pnl"],
  components: {
    Candlechart,
  },
  data() {
    return {
      securityName: "Si",
      fullData: { "data": [[], [], [], [], [], [], []], 
               "KC": [[], [], [], [], [], [], []] },
      ohlcv: { "data": [[], [], [], [], [], [], []], 
               "KC": [[], [], [], [], [], [], []] },
      dataChanged: false,
      width: window.innerWidth - 288,
      height: (window.innerWidth - 288) / 4,
    };
  },
    watch: {
        choosenFutures(newFutures, oldFutures) {
            if (!newFutures || newFutures.length === 0 || 
                !this.choosenDate || this.choosenDate.length === 0) {
                this.ohlcv = { "data": [[], [], [], [], [], [], []], 
                               "KC": [[], [], [], [], [], [], []] }
                this.fullData = { "data": [[], [], [], [], [], [], []], 
                                  "KC": [[], [], [], [], [], [], []] }
                this.dataChanged = !this.dataChanged;
                return;
            }
            this.securityName = this.choosenFutures;
            this.$store.dispatch('candles/loadCandles', [this.choosenFutures, this.choosenDate]);      
        },
        candlesDataUpdated(newValue, oldValue) {
            this.ohlcv = this.candlesData;
            this.dataChanged = !this.dataChanged;
        },
    },
    computed: {
        choosenDate() { return this.$store.state.candles.choosenDate; },
        choosenFutures() {return this.$store.state.candles.choosenFutures; },
        candlesData() { return this.$store.state.candles.candlesData; },
        candlesDataUpdated() { return this.$store.state.candles.candlesDataUpdated; },
        cbox_width() { return Math.floor(this.width / 3); },
        cbox_height() { return Math.floor(this.height); }
      },
    methods: {
        onResize(event) {
            this.width = window.innerWidth - 288;
            this.height = this.width / 4;
        },
    },
    mounted() {
        window.addEventListener("resize", this.onResize);
        this.onResize();
    },
    beforeUnmount() {
        window.removeEventListener("resize", this.onResize);
    },
};
</script>

<style>
.multi-chart {
  display: grid;
  grid-template-columns: 33.33% 33.34% 33.33%;
  background-color: #131722;
}
</style>