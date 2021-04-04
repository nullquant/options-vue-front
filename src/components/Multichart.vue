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
      ohlcv: [[], [], [], [], [], [], []],
      dataChanged: false,
      width: window.innerWidth - 288,
      height: (window.innerWidth - 288) / 4,
    };
  },
  watch: {
    security(newFutures, oldFutures) {
      if (newFutures == null || newFutures.length === 0) return;
      this.securityName = newFutures[0];

      let start = new Date(newFutures[1]);
      this.getData([
        newFutures[0],
        1,
        start.toISOString().slice(0, 10),
        newFutures[1],
      ]);

      start = new Date(newFutures[1]);
      start.setDate(start.getDate() - 2);
      this.getData([
        newFutures[0],
        10,
        start.toISOString().slice(0, 10),
        newFutures[1],
      ]);

      start = new Date(newFutures[1]);
      start.setMonth(start.getMonth() - 6);
      this.getData([
        newFutures[0],
        24,
        start.toISOString().slice(0, 10),
        newFutures[1],
      ]);
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
    getData(settings) {
      // settings[0] = security, settings[1] = scale, settings[2] = start date, settings[3] = end date
      const query =
        "https://iss.moex.com/iss/engines/futures/markets/forts/securities/" +
        settings[0] +
        "/candles.json?from=" +
        settings[2] +
        "&till=" +
        settings[3] +
        "&interval=" +
        settings[1] +
        "&iss.meta=off";
      const axios = this.$axios;
      let index = 0;
      let responseData = [];
      function request(pointer) {
        return axios
          .get(query + "&start=" + index)
          .then((response) => {
            responseData = responseData.concat(
              response.data["candles"]["data"]
            );
            index = responseData.length;
            if (response.data["candles"]["data"].length === 0) {
              console.log("Got candles data [" + responseData.length + "]");
              pointer.processData(responseData, settings[1]);
              return "done";
            }
            return setTimeout(() => request(pointer), 100);
          })
          .catch((error) => {
            console.log(error);
            return "error";
          });
      }
      return request(this);
    },
    processData(responseData, tf) {
      const offset = new Date().getTimezoneOffset() * 60 * 1000;
      let candles = [];
      let candlesX3 = [];
      let candlesX5 = [];
      let lastCandle = [];
      for (let i = 0; i < responseData.length; i++) {
        const date = new Date(responseData[i][6]);
        const candle = [
          date.getTime() - offset,
          responseData[i][0], // open
          responseData[i][2], // high
          responseData[i][3], // low
          responseData[i][1], // close
          responseData[i][5], // volume
        ];
        candles.push(candle);

        if (tf === 24) continue;

        if (lastCandle.length === 0)
          lastCandle = [candle.slice(), candle.slice()];
        else {
          if (date.getMinutes() % 3 === 0) {
            candlesX3.push(lastCandle[0].slice());
            lastCandle[0] = candle.slice();
          } else {
            lastCandle[0][2] = Math.max(candle[2], lastCandle[0][2]);
            lastCandle[0][3] = Math.min(candle[3], lastCandle[0][3]);
            lastCandle[0][4] = candle[4];
            lastCandle[0][5] += candle[5];
          }
          if (
            (tf === 1 && date.getMinutes() % 5 === 0) ||
            (tf === 10 && date.getMinutes() % 60 === 0)
          ) {
            candlesX5.push(lastCandle[1].slice());
            lastCandle[1] = candle.slice();
          } else {
            lastCandle[1][2] = Math.max(candle[2], lastCandle[1][2]);
            lastCandle[1][3] = Math.min(candle[3], lastCandle[1][3]);
            lastCandle[1][4] = candle[4];
            lastCandle[1][5] += candle[5];
          }
        }
      }
      if (tf !== 24) {
        candlesX3.push(lastCandle[0].slice());
        candlesX5.push(lastCandle[1].slice());
      }

      switch (tf) {
        case 1:
          this.ohlcv[0] = candles;
          this.ohlcv[1] = candlesX3;
          this.ohlcv[2] = candlesX5;
          this.dataChanged = !this.dataChanged;
          break;
        case 10:
          this.ohlcv[3] = candles;
          this.ohlcv[4] = candlesX3;
          this.ohlcv[5] = candlesX5;
          this.dataChanged = !this.dataChanged;
          break;
        case 24:
          this.ohlcv[6] = candles;
          this.dataChanged = !this.dataChanged;
          break;
        default:
      }
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
  beforeDestroy() {
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