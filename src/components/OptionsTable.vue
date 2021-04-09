<template>
  <div>
    <div class="radio-group" v-if="choosedOption!=-1">
        <b-form-radio-group class="radio-buttons"
          id="chain-buttons"
          v-model="choosedOption"
          :options="optionsArray"
          name="option-chain-buttons"
          buttons
        ></b-form-radio-group>
    </div>
    <div class="table">
      <b-table 
        :items="items"></b-table>
    </div>
  </div>
</template>

<script>
export default {
  name: "OptionsPanel",
  components: {},
  props: ["choosenDate", "baseAsset"],
  data() {
    return {
      choosedOption: -1,
      optionsArray: [],
    }
  },
  watch: {
    choosenDate(newDate, oldDate) {
      const query = "http://localhost:5000/api/v1/options?date=" + 
        this.choosenDate + "&q=" + this.$props.baseAsset;
      this.$axios.get(query)
          .then((response) => {
              if (response.status === 200) {
                console.log("Got options data [" + 
                  response.data.length + "]");
                this.optionsArray = [];
                console.log(response.data)
                for (let i = 0; i < response.data.length; i++) {
                  const cDate = new Date(this.$props.choosenDate);
                  const eDate = new Date(response.data[i][5]);
                  const remain = Math.floor(
                    (eDate.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const textDate = eDate.toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .slice(0, -3) + " [" + remain + "]";
                  this.optionsArray.push(
                    { text: textDate, value: i});
                }
                this.choosedOption = 0;
                //this.$emit("selected", "");
                return "done";
              }
              this.choosedOption = "";
              this.optionsArray = [];
              console.log("Got error: " + response.data);
              return "error";
          })
          .catch((error) => {
            this.choosedOptions = "";
            this.optionsArray = [];
            console.log(error);
            return "error";
          });
    },
  },
  methods: {
  }
}
</script>

<style>

.radio-group {
  display: flex;
  align-items: center;
  padding: 10px 10px 10px 10px;
  width: 100%;
}

.radio-buttons {
  display: flex;
  align-items: center;
  padding: 0px;
  width: 100%;
}

</style>