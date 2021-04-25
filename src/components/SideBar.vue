<template>
  <div class="sidebar">
    <div class="radio-group">
        <b-form-radio-group class="radio-buttons"
          id="asset-buttons"
          v-model="baseAsset"
          :options="baseAssetArray"
          @input="updateBaseAsset"
          name="base-asset-buttons"
          buttons
        ></b-form-radio-group>
    </div>
    <div class="datepicker">
      <b-form-datepicker
        id="dpicker"
        :dark="true"
        :date-format-options="{
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }"
        start-weekday="1"
        :hide-header="true"
        v-model="choosenDate"
        @input="updateDate"
      ></b-form-datepicker>
    </div>
    <div class="sidebar-item">
      <Derivative 
        label="Futures:" />
    </div>
    <div class="sidebar-item">
      <div class="container">
        <div class="row align-items-center" style="padding: 0px 0px 0px 0px">
          <div class="col-sm px-1">
            <b-form-timepicker
              id="tpicker"
              :dark="true"
              :hide-header="true"
              :no-close-button="true"
              v-model="choosenTime"
              @input="updateTime"
            ></b-form-timepicker>
          </div>
          <div class="col-sm-auto px-1">
            <b-form-select
              v-model="selectedTimeFrame"
              :options="timeFrameArray"
            ></b-form-select>
          </div>
          <div class="col-sm-auto px-1">
            <b-button @click="timeGo">></b-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Derivative from "./Derivative.vue";

export default {
    name: "SideBar",
    components: { Derivative },
    data() {
        return {
            choosenDate: "",
            choosenTime: "10:00",
            baseAsset: "Si",
            baseAssetArray: [
                { text: "USDRUB", value: "Si" },
                { text: "RTS", value: "RI" },
                { text: "Brent", value: "BR" }
            ],      
            selectedTimeFrame: 1,
            timeFrameArray: [
                {value: 1, text: "1m"},
                {value: 10, text: "10m"},
                {value: 60, text: "1H"}
            ]
        };
    },
    methods: {
        updateDate(payload) {
            this.$store.dispatch('candles/setDate', this.choosenDate);
        },
        updateTime(payload) {
            this.$store.dispatch('candles/setTime', this.choosenTime);
        },
        updateBaseAsset(payload) {
            this.$store.dispatch('candles/setBaseAsset', this.baseAsset);
        },
        timeGo() {
            const stringArray = this.choosenTime.split(":");
            let hour = parseInt(stringArray[0]);
            let min = parseInt(stringArray[1]);
            switch(this.selectedTimeFrame) {
                case 1: min = min + 1;
                        break;
                case 10: min = Math.floor(min / 10) * 10 + 10;
                        break;
                default: min = 0;
                        hour = hour + 1;
                        break; 
            }
            if (min > 59) {
                hour = hour + 1;
                min = min - 60;
            }
            if (hour > 23) {
                hour = 23;
                min = 59;
            }
            this.choosenTime = String(hour).padStart(2, '0') + ":" + String(min).padStart(2, '0');
            this.updateTime();
        }
    },
};
</script>

<style scoped>
.sidebar {
  padding: 0;
  margin-top: 0px;
  list-style-type: none;
  width: 100%;
}

.radio-group {
  display: flex;
  align-items: center;
  padding: 20px 15px 10px 15px;
  width: 100%;
}

.radio-buttons {
  display: flex;
  align-items: center;
  padding: 0px;
  width: 100%;
}

.datepicker {
  display: flex;
  align-items: center;
  padding: 10px 15px 10px 15px;
  width: 100%;
}

.sidebar-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px 10px 10px;
}

.timepicker {
  display: flex;
  align-items: center;
  padding: 10px 10px 10px 10px;
  width: 100%;
}
</style>