<template>
  <div class="grid-container">
    <aside class="sidenav">
      <SideBar />
    </aside>
    <main class="main">
      <div>
        <Multichart
          :pnl="linePNL"
        />
        <Options
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
      linePNL: [],
    };
  },
  methods: {
    updatePNL(payload) {
      this.linePNL = payload;
    },
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
