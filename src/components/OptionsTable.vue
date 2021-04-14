<template>
  <div>
    <div class="radio-group" v-if="choosedOption!=-1">
        <b-form-radio-group class="radio-buttons"
          id="chain-buttons"
          v-model="choosedOption"
          :options="optionsExpirationArray"
          name="option-chain-buttons"
          buttons
        ></b-form-radio-group>
    </div>
    <div class="table">
      <b-table 
        ref="otable"
        :fields="fields"
        :items="getOptionTable"
        :dark="true"
        head-variant="dark"
        small
      >
        <template #thead-top>
          <b-tr>
            <b-th colspan="3">Calls</b-th>
            <b-th></b-th>
            <b-th colspan="3">Puts</b-th>
          </b-tr>
        </template>      
      </b-table>
    </div>
  </div>
</template>

<script>
export default {
  name: "OptionsPanel",
  components: {},
  props: ["choosenDate", "baseAsset", "choosenTime"],
  data() {
    return {
      choosedOption: -1,
      optionsDescriptionArray: [],
      optionsExpirationArray: [],
      optionsData: [],
      fields: [
          { key: 'call_bid', label: 'Bid' },
          { key: 'call_last', label: 'Last' },
          { key: 'call_ask', label: 'Ask' },
          { key: 'strike', label: 'Strike', 
            tdClass: 'strike-border' },
          { key: 'put_bid', label: 'Bid' },
          { key: 'put_last', label: 'Last' },
          { key: 'put_ask', label: 'Ask' }
      ],
      optionTable: [],
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
                this.optionsExpirationArray = [];
                this.optionsDescriptionArray = response.data;
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
                  this.optionsExpirationArray.push(
                    { text: textDate, value: i});
                }
                this.choosedOption = 0;
                this.optionsData = new Array(this.optionsDescriptionArray.length);
                this.$refs.otable.refresh()
                return "done";
              }
              this.choosedOption = -1;
              this.optionsExpirationArray = [];
              this.optionsDescriptionArray = [];
              this.optionsData = [];
              console.log("Got error: " + response.data);
              return "error";
          })
          .catch((error) => {
            this.choosedOptions = -1;
            this.optionsExpirationArray = [];
            this.optionsDescriptionArray = [];
            this.optionsData = [];
            console.log(error);
            return "error";
          });
    },
    choosenOption(newOption, oldOption) {
      this.$refs.otable.refresh()
    },
    choosenTime(newTime, oldTime) {
      this.$refs.otable.refresh()
    }
  },
  methods: {
    getOptionTable(ctx, callback) {
      // No date selected or error
      if (this.choosedOption < 0) {
        return [];
      }
      // No data for selected option
      if (!this.optionsData[this.choosedOptions]) {
        const query = "http://localhost:5000/api/v1/options/tables?sec=" + 
          this.optionsDescriptionArray[this.choosedOption][1] + "&asset=" + 
          this.optionsDescriptionArray[this.choosedOption][3] + "&date=" + 
          this.choosenDate;
        this.$axios.get(query)
          .then((response) => {
            if (response.status != 200) {
              console.log("Got error: " + response.data);
              callback([]);
            } else {
              this.optionsData[this.choosedOption] = response.data;
              console.log("Got options candles");
              const table = this.parseOptionData(this.optionsData[this.choosedOption]);
              callback(table);
            }
          })
          .catch((error) => {
            console.log("Got error:" + error);
            return [];
          });
      } else {
        callback(this.parseOptionData(this.optionsData[this.choosedOption]));
        return [];
      }
      return null;
    },
    parseOptionData(data) {
      const newEpoch = this.getTimeEpoch(data[0]["epoch"], this.$props.choosenTime);
      const index = this.findIndex(data, newEpoch);
      return data[index]["option_table"];
    },
    getTimeEpoch(oldEpoch, newTime) {
      const lastDate = new Date(oldEpoch);
      const strArray = newTime.split(":");
      lastDate.setUTCHours(parseInt(strArray[0]));
      lastDate.setUTCMinutes(parseInt(strArray[1]));
      return lastDate.valueOf();
    },
    findIndex(data, epoch) {
      let left = 0;
      let right = data.length;
      let index = Math.floor((left + right) / 2);
      while(right - left > 1) {
        if (data[index]["epoch"] === epoch) return index;
        if (data[index]["epoch"] < epoch) left = index;
        else right = index;
        index = Math.floor((left + right) / 2);
      }
      return right;
    }
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