<template>
  <div id="multi-chart">
    <chartbox
      id="1m"
      :security="securityName"
      :scale="0"
      :ohlcv="ohlcv"
      :dataChanged="dataChanged"
      :width="cbox_width"
      :height="cbox_height"
      :night="night"
    >
    </chartbox>
    <chartbox
      id="H"
      :security="securityName"
      :scale="5"
      :ohlcv="ohlcv"
      :dataChanged="dataChanged"
      :width="cbox_width"
      :height="cbox_height"
      :night="night"
    >
    </chartbox>
    <chartbox
      id="D"
      :security="securityName"
      :scale="6"
      :ohlcv="ohlcv"
      :dataChanged="dataChanged"
      :width="cbox_width"
      :height="cbox_height"
      :night="night"
    >
    </chartbox>
  </div>
</template>

<script>
import Chartbox from "./ChartBox.vue";

export default {
  name: "Multichart",
  props: ["night", "security", "scale", "time"],
  components: {
    Chartbox,
  },
  data() {
    return {
      securityName: "Si",
      scales: [],
      selectedTime: "10:00",
      ohlcv: { "data": [[], [], [], [], [], [], []], 
               "KC": [[], [], [], [], [], [], []] },
      dataChanged: false,
      width: window.innerWidth - 288,
      height: (window.innerWidth - 288) / 4,
    };
  },
  watch: {
    security(newFutures, oldFutures) {
      if (newFutures == null || newFutures.length === 0) return;
      this.securityName = newFutures[0];
      const query =
        "http://localhost:5000/api/v1/futures/candles?sec=" +
        newFutures[0] +
        "&date=" +
        newFutures[1];      
      this.$axios
        .get(query)
        .then((response) => {
          if (response.status === 200) {
            console.log("Got candles data [" + response.data["data"][0].length + "]");
            this.ohlcv = response.data;
            this.dataChanged = !this.dataChanged;
          } else console.log("Got error: " + response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    scale(newScales, oldScales) {
      console.log("MC:" + newScales);
    },
    time(newTime, oldTime) {
      console.log("MC:" + newTime);
    },
  },
  methods: {
    onResize(event) {
      this.width = window.innerWidth - 288;
      this.height = this.width / 4;
    },
  },
  computed: {
    cbox_width() {
      return Math.floor(this.width / 3);
    },
    cbox_height() {
      return Math.floor(this.height);
    },
  },
  mounted() {
    window.addEventListener("resize", this.onResize);
    this.onResize();
  },
  beforeMount() {
    window.removeEventListener("resize", this.onResize);
  },
};
</script>

<style>
#multi-chart {
  display: grid;
  grid-template-columns: 33.33% 33.34% 33.33%;
  height: 100%;
  background-color: #1E222D;
}
</style>