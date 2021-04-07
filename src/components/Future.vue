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
        "http://localhost:5000/api/v1/security?sec=" +
        newFutures.substring(0, 4);
      this.$axios
        .get(query)
        .then((response) => {
          if (response.status === 200) {
            const cDate = new Date(this.$props.choosenDate);
            const eDate = new Date(response.data[0][6]);
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
              .slice(0, -3) + " [" + remain + "]";
            this.$emit("selected", newFutures.substring(0, 4));
          } else {
            console.log("Got error: " + response.data);
            this.$emit("selected", "");
            return;
          }
        })
        .catch((error) => {
          console.log(error);
          this.$emit("selected", "");
        });
    },
    choosenDate(newDate, oldDate) {
      const query = "http://localhost:5000/api/v1/futures?date=" + newDate;
      this.$axios.get(query)
          .then((response) => {
              if (response.status === 200) {
                console.log("Got futures data [" + response.data.length + "]");
                this.filterFutures(response.data);
                return "done";
              }
              this.selectedFutures = "";
              console.log("Got error: " + response.data);
              return "error";
          })
          .catch((error) => {
            this.selectedFutures = "";
            console.log(error);
            return "error";
          });
    }
  },
  methods: {
    filterFutures(responseData) {
      let found = responseData.filter(function (future) {
        return (
          future[1][0] === "S" &&
          future[1][1] === "i" &&
          future[1].length === 4
        );
      });
      found.sort(function (a, b) {
        const dy = parseFloat(a[1][3]) - parseFloat(b[1][3]);
        if (dy === 0) return a[1][2].localeCompare(b[1][2]);
        return dy;
      });
      this.futuresArray = [];
      for (let i = 0; i < found.length; i++) {
        let month = "";
        switch (found[i][1][2]) {
          case "F":
            month = "-1.";
            break;
          case "G":
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
          found[i][1] + "  (" + month + "2" + found[i][1][3] + ")"
        );
      }
      this.selectedFutures = "";
    },
  },
};
</script>

<style>
</style>