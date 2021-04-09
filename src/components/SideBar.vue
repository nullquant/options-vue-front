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
        label="Futures:"
        type="futures"
        :baseAsset="baseAsset"
        :choosenDate="choosenDate" 
        @selected="updateFutures" />
    </div>
    <div class="timepicker">
      <b-form-timepicker
        id="tpicker"
        :dark="true"
        :hide-header="true"
        :no-close-button="true"
        v-model="choosenTime"
        @input="updateTime"
      ></b-form-timepicker>
    </div>
  </div>
</template>

<script>
import Derivative from "./Derivative.vue";

export default {
  name: "SideBar",
  components: { Derivative },
  emits: ["futures", "options", "date", "time", "base-asset"],
  data() {
    return {
      choosenDate: "",
      choosenTime: "10:00:00",
      baseAsset: "Si",
      baseAssetArray: [
        { text: "USDRUB", value: "Si" },
        { text: "RTS", value: "RI" },
        { text: "Brent", value: "BR" }
      ]      
    };
  },
  methods: {
    updateDate(payload) {
      this.$emit("date", this.choosenDate);
    },
    updateTime(payload) {
      if (payload) this.$emit("time", this.choosenTime);
    },
    updateFutures(payload) {
      this.$emit("futures", [payload, this.choosenDate, this.choosenTime]);
    },
    updateBaseAsset(payload) {
      this.$emit("base-asset", this.baseAsset);
    },
    updateOptions(payload) { }
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
  padding: 20px 10px 10px 10px;
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
  padding: 10px 10px 10px 10px;
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