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
    props: ["label"],
    data() {
        return {
            selectedDerivative: "",
            derivativesArray: [],
            expirationDate: "",
        };
    },
    computed: {
        choosenBaseAsset() { return this.$store.state.candles.choosenBaseAsset; },
        choosenDate() { return this.$store.state.candles.choosenDate; },
    },
    watch: {
        choosenBaseAsset(newBase, oldBase) {
            this.getDerivatives();
        },
        choosenDate(newDate, oldDate) {
            this.getDerivatives();
        },
        selectedDerivative(newDerivative, oldDerivative) {
            if (newDerivative == null || newDerivative.length === 0) {
                this.$store.dispatch('candles/setFutures', ['', 0]);
            return;
            }
            const query =
                "http://localhost:5000/api/v1/security?sec=" + newDerivative.substring(0, 4);
            this.$axios
                .get(query)
                .then((response) => {
                    if (response.status === 200) {
                        const cDate = new Date(this.choosenDate);
                        const eDate = new Date(response.data[0][6]);
                        const remain = Math.floor((eDate.getTime() - cDate.getTime()) / 
                            (1000 * 60 * 60 * 24));
                        this.expirationDate = eDate.toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        }).slice(0, -3) + " [" + remain + "]";
                        this.$store.dispatch('candles/setFutures', [newDerivative.substring(0, 4), remain]);
                    } else {
                        console.log("Got error: " + response.data);
                        this.$store.dispatch('candles/setFutures', ['', 0]);
                        return;
                    }
                })
                .catch((error) => {
                    if (error.response) {
                        // Request made and server responded
                        console.log(error.response.data);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                    } else if (error.request) {
                        // The request was made but no response was received
                        console.log(error.request);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', error.message);
                    }
                    this.$store.dispatch('candles/setFutures', ['', 0]);
                });
        },
    },
    methods: {
        getDerivatives() {
            if (this.choosenDate == null || this.choosenDate.length === 0) return;
            const query = "http://localhost:5000/api/v1/futures" + 
                "?date=" + this.choosenDate + "&q=" + this.choosenBaseAsset;
            this.$axios.get(query)
                .then((response) => {
                    if (response.status === 200) {
                        console.log("Got futures data [" + 
                            response.data.length + "]");
                        this.derivativesArray = [];
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].length > 1) 
                            this.derivativesArray.push( response.data[i][0] + 
                                " (" + response.data[i][1] + ")");
                        else this.derivativesArray.push( response.data[i][0] );
                    }
                    this.selectedDerivative = this.derivativesArray[0];
                    return "done";
                }
                this.selectedDerivative = "";
                this.derivativesArray = [];
                console.log("Got error: " + response.data);
                return "error";
                })
                .catch((error) => {
                    if (error.response) {
                        // Request made and server responded
                        console.log(error.response.data);
                        console.log(error.response.status);
                        console.log(error.response.headers);
                    } else if (error.request) {
                        // The request was made but no response was received
                        console.log(error.request);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        console.log('Error', error.message);
                    }
                    this.selectedDerivative = "";
                    this.derivativesArray = [];
                    return "error";
                });
        },
    },
};
</script>

<style>
</style>