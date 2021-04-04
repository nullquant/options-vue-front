<template>
  <div class="sidebar">
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
      <Future :choosenDate="choosenDate" @selected="updateFutures" />
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
import Future from "./Future.vue";

export default {
  name: "SideBar",
  components: { Future },
  emits: ["futures", "scale", "time"],
  data() {
    return {
      choosenDate: "",
      choosenTime: "10:00:00",
    };
  },
  methods: {
    updateDate(payload) {},
    updateTime(payload) {
      if (payload) this.$emit("time", this.choosenTime);
    },
    updateFutures(payload) {
      if (payload)
        this.$emit("futures", [payload, this.choosenDate, this.choosenTime]);
    },
    updateSelectedScale(payload) {
      this.$emit("scale", [
        this.selectedScale1,
        this.selectedScale2,
        this.selectedScale3,
      ]);
    },
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

.datepicker {
  display: flex;
  align-items: center;
  padding: 20px 10px 10px 10px;
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