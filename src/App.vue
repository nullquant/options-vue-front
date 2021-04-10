<template>
  <div class="grid-container">
    <aside class="sidenav">
      <SideBar
        @date="updateDate"
        @time="updateTime"
        @base-asset="updateBaseAsset"
        @futures="updateFutures"
      />
    </aside>
    <main class="main">
      <div>
        <Multichart
          :security="choosenFutures"
          :time="choosenTime"
        />
        <b-tabs style="padding: 20px 0px 00px 00px">
          <b-tab title="Options Table">
            <options-table
              :choosenDate="choosenDate"
              :baseAsset="baseAsset"
              :choosenTime="choosenTime"
            />
          </b-tab>
          <b-tab title="Strategy">
            <p>Strategy here...</p>
          </b-tab>
        </b-tabs>
      </div>
    </main>
  </div>
</template>

<script>
import Multichart from "./components/Multichart.vue";
import SideBar from "./components/SideBar.vue";
import OptionsTable from "./components/OptionsTable.vue";

export default {
  name: "App",
  components: {
    Multichart,
    SideBar,
    OptionsTable,
  },
  data() {
    return {
      choosenDate: "",
      choosenTime: "10:00",
      baseAsset: "Si",
      choosenFutures: [],
    };
  },
  methods: {
    updateDate(payload) {
      this.choosenDate = payload;
    },
    updateTime(payload) {
      this.choosenTime = payload;
    },
    updateBaseAsset(payload) {
      this.baseAsset = payload;
    },
    updateFutures(payload) {
      this.choosenFutures = payload;
    }
  },
};
</script>

<style>
.grid-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 1fr;
  grid-template-areas:
    "sidenav main";
  height: 100vh;
}

.header {
  grid-area: header;
  background-color: #131722;
}

.sidenav {
  display: flex; /* Will be hidden on mobile */
  grid-area: sidenav;
  background-color: #1E222D;
  border: 0.5px;
  border-style: none solid none none;
  border-color: #434651;
}

.main {
  grid-area: main;
  background-color: #131722;
  border: 0.5px;
  border-style: solid none solid none;
  border-color: #434651;
}

.footer {
  grid-area: footer;
  background-color: #131722;
}
</style>
