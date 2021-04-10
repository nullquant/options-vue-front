<template>
  <div class="container">
    <div class="row align-items-center" style="padding: 0px 0px 0px 0px">
      <div class="col-sm px-1">{{label}}</div>
      <div class="col-m px-1">
        <b-form-select
          v-model="selectedDerivative"
          :options="derivativesArray"
        ></b-form-select>
      </div>
    </div>
    <div
      class="row align-items-center"
      style="padding: 20px 0px 0px 0px"
      v-if="selectedDerivative"
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
  props: ["label", "type", "baseAsset", "choosenDate"],
  emits: ["selected"],
  data() {
    return {
      selectedDerivative: "",
      derivativesArray: [],
      expirationDate: "",
    };
  },
  watch: {
    selectedDerivative(newDerivative, oldDerivative) {
      if (newDerivative == null || newDerivative.length === 0) {
        this.$emit("selected", "");
        return;
      }
      const query =
        "http://localhost:5000/api/v1/security?sec=" +
        newDerivative.substring(0, 4);
      console.log(query)
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
            this.$emit("selected", newDerivative.substring(0, 4));
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
      this.getDerivatives();
    },
    baseAsset(newBase, oldBase) {
      this.getDerivatives();
    },
  },
  methods: {
    getDerivatives() {
      if (this.choosenDate == null || this.choosenDate.length === 0) return;
      const query = "http://localhost:5000/api/v1/" + this.$props.type + 
        "?date=" + this.choosenDate + "&q=" + this.baseAsset;
      this.$axios.get(query)
          .then((response) => {
              if (response.status === 200) {
                console.log("Got "+ this.$props.type +" data [" + 
                  response.data.length + "]");
                this.derivativesArray = [];
                console.log(response.data)
                for (let i = 0; i < response.data.length; i++) {
                  if (response.data[i].length > 1) 
                    this.derivativesArray.push( response.data[i][0] + 
                      " (" + response.data[i][1] + ")");
                  else 
                    this.derivativesArray.push( response.data[i][0] );
                }
                this.selectedDerivative = "";
                this.$emit("selected", "");
                return "done";
              }
              this.selectedDerivative = "";
              this.derivativesArray = [];
              console.log("Got error: " + response.data);
              return "error";
          })
          .catch((error) => {
            this.selectedDerivative = "";
            this.derivativesArray = [];
            console.log(error);
            return "error";
          });
    },
  },
};
</script>

<style>
</style>