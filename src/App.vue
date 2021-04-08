<template>
  <div class="grid-container">
    <aside class="sidenav">
      <SideBar
        @futures="updateFutures"
        @time="updateTime"
      />
    </aside>
    <main class="main">
      <Multichart
        :security="choosenFutures"
        :time="choosenTime"
      />
    </main>
    <footer class="footer"></footer>
  </div>
</template>

<script>
import Multichart from "./components/Multichart.vue";
import SideBar from "./components/SideBar.vue";

export default {
  name: "App",
  components: {
    Multichart,
    SideBar,
  },
  data() {
    return {
      choosenFutures: [],
      choosenTime: "10:00:00",
    };
  },
  methods: {
    updateFutures(payload) {
      this.choosenFutures = payload;
    },
    updateTime(payload) {
      if (payload) this.choosenTime = payload;
    }
  },
};
</script>

<style>
.grid-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 1fr 50px;
  grid-template-areas:
    "sidenav main"
    "sidenav footer";
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
