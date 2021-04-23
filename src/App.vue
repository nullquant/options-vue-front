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
          :pnl="linePNL"
          @price="updatePrice"
        />
        <Options
          :choosenDate="choosenDate"
          :choosenTime="choosenTime"
          :baseAsset="baseAsset"
          :price="lastPrice"
          @pnl="updatePNL"
        />
      </div>
    </main>
  </div>
</template>

<script>
import Multichart from "./components/Multichart.vue";
import SideBar from "./components/SideBar.vue";
import Options from "./components/Options.vue";

export default {
  name: "App",
  components: {
    Multichart,
    SideBar,
    Options,
  },
  data() {
    return {
      choosenDate: "",
      choosenTime: "10:00",
      baseAsset: "Si",
      choosenFutures: [],
      lastPrice: 0,
      linePNL: [],
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
    },
    updatePNL(payload) {
      this.linePNL = payload;
    },
    updatePrice(payload) {
      this.lastPrice = payload;
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
