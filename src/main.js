import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import axios from "axios";
import App from "./App.vue";
import "./app.scss";

Vue.prototype.$axios = axios;

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App)
}).$mount("#app");
