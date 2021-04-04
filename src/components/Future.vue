<template>
  <div class="container">
    <div class="row align-items-center" style="padding: 0px 0px 10px 0px">
      <div class="col-sm px-1">Futures</div>
      <div class="col-m px-1">
        <b-form-select
          v-model="selectedFutures"
          :options="futuresArray"
        ></b-form-select>
      </div>
    </div>
    <div
      class="row align-items-center"
      style="padding: 10px 0px 0px 0px"
      v-if="selectedFutures"
    >
      <div class="col-sm px-1">Expiration</div>
      <div class="col-m px-1">
        {{ expirationDate }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Futures",
  components: {},
  props: ["choosenDate"],
  emits: ["selected"],
  data() {
    return {
      selectedFutures: "",
      futuresArray: [],
      expirationDate: "",
    };
  },
  watch: {
    selectedFutures(newFutures, oldFutures) {
      if (newFutures == null || newFutures.length === 0) {
        this.$emit("selected", "");
        return;
      }
      const query =
        "https://iss.moex.com/iss/securities/" +
        newFutures.substring(0, 4) +
        ".json";
      this.$axios
        .get(query)
        .then((response) => {
          const cDate = new Date(this.$props.choosenDate);
          const eDate = new Date(response.data["description"]["data"][6][2]);
          const remain = Math.floor(
            (eDate.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          this.expirationDate =
            eDate
              .toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
              .slice(0, -3) +
            " [" +
            remain +
            "]";
          this.$emit("selected", newFutures.substring(0, 4));
        })
        .catch((error) => {
          console.log(error);
          this.$emit("selected", "");
        });
    },
    choosenDate(newDate, oldDate) {
      const query =
        "https://iss.moex.com/iss/history/engines/futures/markets/forts/securities.json?date=" +
        newDate +
        "&iss.meta=off";
      const axios = this.$axios;
      let index = 0;
      let responseData = [];
      function request(pointer) {
        return axios
          .get(query + "&start=" + index)
          .then((response) => {
            responseData = responseData.concat(
              response.data["history"]["data"]
            );
            index += response.data["history.cursor"]["data"][0][2];
            if (index >= response.data["history.cursor"]["data"][0][1]) {
              console.log("Got futures data [" + responseData.length + "]");
              pointer.filterFutures(responseData);
              return "done";
            }
            return setTimeout(() => request(pointer), 100);
          })
          .catch((error) => {
            pointer.selectedFutures = "";
            console.log(error);
            return "error";
          });
      }
      return request(this);
    },
  },
  methods: {
    filterFutures(responseData) {
      let found = responseData.filter(function (future) {
        return (
          future[2][0] === "S" &&
          future[2][1] === "i" &&
          future[2].length === 4 &&
          future[9] > 0
        );
      });
      found.sort(function (a, b) {
        const dy = parseFloat(a[2][3]) - parseFloat(b[2][3]);
        if (dy === 0) return a[2][2].localeCompare(b[2][2]);
        return dy;
      });
      this.futuresArray = [];
      for (let i = 0; i < found.length; i++) {
        let month = "";
        switch (found[i][2][2]) {
          case "F":
            month = "-1.";
            break;
          case "GF":
            month = "-2.";
            break;
          case "H":
            month = "-3.";
            break;
          case "J":
            month = "-4.";
            break;
          case "K":
            month = "-5.";
            break;
          case "M":
            month = "-6.";
            break;
          case "N":
            month = "-7.";
            break;
          case "Q":
            month = "-8.";
            break;
          case "U":
            month = "-9.";
            break;
          case "V":
            month = "-10.";
            break;
          case "X":
            month = "-11.";
            break;
          case "Z":
            month = "-12.";
            break;
          default:
            month = ".";
        }
        this.futuresArray.push(
          found[i][2] + "  (" + month + "2" + found[i][2][3] + ")"
        );
      }
      this.selectedFutures = "";
    },
  },
};
</script>

<style>
</style>