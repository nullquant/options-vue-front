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
      :night="night"
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
      :night="night"
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
      :night="night"
    >
    </candlechart>
  </div>
</template>

<script>
import Candlechart from "./CandleChart.vue";

export default {
  name: "Multichart",
  props: ["night", "security", "time", "pnl"],
  components: {
    Candlechart,
  },
  data() {
    return {
      securityName: "Si",
      //selectedTime: "10:00",
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
    security(newFutures, oldFutures) {
      if (newFutures == null || newFutures.length === 0 || 
        newFutures[0] == null || newFutures[0].length == 0) {
        this.ohlcv = { "data": [[], [], [], [], [], [], []], 
               "KC": [[], [], [], [], [], [], []] }
        this.fullData = { "data": [[], [], [], [], [], [], []], 
               "KC": [[], [], [], [], [], [], []] }
        this.dataChanged = !this.dataChanged;
        return;
      }
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
            this.fullData = response.data;
            this.ohlcvSlice();
            this.dataChanged = !this.dataChanged;
          } else console.log("Got error: " + response.data);
        })
        .catch((error) => {
          if (error.response) {
          // Request made and server responded
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
          } else if (error.request) {
          // The request was made but no response was received
              console.log(error.request);
          } else {
          // Something happened in setting up the request that triggered an Error
              console.log('Error', error.message);
          }
        });
    },
    time(newTime, oldTime) {
      this.ohlcvSlice();
      this.dataChanged = !this.dataChanged;
    },
  },
  methods: {
    onResize(event) {
      this.width = window.innerWidth - 288;
      this.height = this.width / 4;
    },
    ohlcvSlice() {
      const newEpoch = this.getTimeEpoch(this.$props.time)
      if (newEpoch < 0) return;
      let dataArray = []
      let KCArray = []
      for (let i = 0; i < 6; i++) {
        const index = this.findIndex(this.fullData["data"][i], newEpoch);
        dataArray.push(this.fullData["data"][i].slice(0, index))
        KCArray.push(this.fullData["KC"][i].slice(0, index))
      }
      const dayLength = this.fullData["data"][6].length;
      dataArray.push(this.fullData["data"][6].slice(0, dayLength-1))
      KCArray.push(this.fullData["KC"][6].slice(0, dayLength-1))
      this.ohlcv = { "data": dataArray, "KC": KCArray };
    },
    getTimeEpoch(newTime) {
      if (this.fullData["data"][0].length === 0) return -1;
      const lastEpoch = this.fullData["data"][0][this.fullData["data"][0].length-1][0];
      const lastDate = new Date(lastEpoch);
      const strArray = newTime.split(":");
      lastDate.setUTCHours(parseInt(strArray[0]));
      lastDate.setUTCMinutes(parseInt(strArray[1]));
      return lastDate.valueOf();
    },
    findIndex(dataArray, epoch) {
      let left = 0;
      let right = dataArray.length;
      let index = Math.floor((left + right) / 2);
      while(right - left > 1) {
        if (dataArray[index][0] === epoch) return index;
        if (dataArray[index][0] < epoch) left = index;
        else right = index;
        index = Math.floor((left + right) / 2);
      }
      return left;
    }
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