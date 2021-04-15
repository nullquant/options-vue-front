<template>
  <div>
    <div class="radio-group" v-if="choosenOption!=-1">
        <b-form-radio-group class="radio-buttons"
          id="chain-buttons"
          v-model="choosenOption"
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
            <b-th colspan="6">Calls</b-th>
            <b-th></b-th>
            <b-th colspan="6">Puts</b-th>
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
      choosenOption: -1,
      optionsDescriptionArray: [],
      optionsExpirationArray: [],
      optionsData: [],
      optionDataIndex: 0,
      fields: [
          { key: 'call_oi', label: 'OI' },
          { key: 'call_iv', label: 'IV' },
          { key: 'call_last', label: 'Last' },
          { key: 'call_bid', label: 'Bid' },
          { key: 'call_mid', label: 'Mid' },
          { key: 'call_ask', label: 'Ask' },
          { key: 'strike', label: 'Strike', 
            tdClass: 'strike-border' },
          { key: 'put_bid', label: 'Bid' },
          { key: 'put_mid', label: 'Mid' },
          { key: 'put_ask', label: 'Ask' },
          { key: 'put_last', label: 'Last' },
          { key: 'put_iv', label: 'IV' },
          { key: 'put_oi', label: 'OI' }
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
                this.choosenOption = 0;
                this.optionsData = new Array(this.optionsDescriptionArray.length);
                this.$refs.otable.refresh()
                return "done";
              }
              this.choosenOption = -1;
              this.optionsExpirationArray = [];
              this.optionsDescriptionArray = [];
              this.optionsData = [];
              console.log("Got error: " + response.data);
              return "error";
          })
          .catch((error) => {
            this.choosenOptions = -1;
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
      if (this.choosenOption < 0) {
        return [];
      }
      // No data for selected option
      if (this.optionsData[this.choosenOption]) {
        const table = this.parseOptionData(this.optionsData[this.choosenOption]);
        callback(table);
        return null;
      } else  {
        const query = "http://localhost:5000/api/v1/options/tables?sec=" + 
          this.optionsDescriptionArray[this.choosenOption][1] + "&asset=" + 
          this.optionsDescriptionArray[this.choosenOption][3] + "&date=" + 
          this.choosenDate;
        this.$axios.get(query)
          .then((response) => {
            if (response.status != 200) {
              console.log("Got error: " + response.data);
              callback([]);
            } else {
              this.optionsData[this.choosenOption] = response.data;
              console.log("Got options tables [" + this.optionsData[this.choosenOption].length + "]");
              if (this.optionsData[this.choosenOption].length != 0) {
                const table = this.parseOptionData(this.optionsData[this.choosenOption]);
                callback(table);
              } else {
                callback([]);
              }
            }
          })
          .catch((error) => {
            console.log("Got error:" + error);
            return [];
          });
      }
      return null;
    },
    parseOptionData(data) {
      const slicedTable = this.optionTableSlice(data);
      let table = slicedTable.map(a => Object.assign({}, a));
      const epoch = this.getTimeEpoch(data[0]["epoch"], this.$props.choosenTime);
      for (let i=0; i<table.length; i++) {
        table[i]["call_last"] = this.lastPriceString(table[i]["call_last"], epoch, table[i]["call_last_time"]);
        table[i]["put_last"] = this.lastPriceString(table[i]["put_last"], epoch, table[i]["put_last_time"]);
        if (table[i]["itm"].indexOf("CALL") !== -1) {
          table[i]["_cellVariants"] = { call_oi: 'info', call_iv: 'info', call_bid: 'info', 
                                        call_last: 'info', call_ask: 'info', call_mid: 'info'};
        }
        if (table[i]["itm"].indexOf("PUT") !== -1) {
          table[i]["_cellVariants"] = { put_oi: 'info', put_iv: 'info', put_bid: 'info', 
                                        put_last: 'info', put_ask: 'info', put_mid: 'info'};
        }
      }
      return table;
    },
    optionTableSlice(data) {
      const maxIndex = data.length - 1;
      const newEpoch = this.getTimeEpoch(data[0]["epoch"], this.$props.choosenTime);
      if ((newEpoch >= data[this.optionDataIndex]["epoch"]) && 
          (newEpoch < data[Math.min(this.optionDataIndex + 1, maxIndex)]["epoch"])) {
            return data[this.optionDataIndex]["option_table"];
      }

      if ((newEpoch >= data[Math.min(this.optionDataIndex + 1, maxIndex)]["epoch"]) && 
          (newEpoch < data[Math.min(this.optionDataIndex + 2, maxIndex)]["epoch"])) {
            this.optionDataIndex = Math.min(this.optionDataIndex + 1, maxIndex);
            return data[this.optionDataIndex]["option_table"];
          }

      const index = this.findIndex(data, newEpoch);
      this.optionDataIndex = index;
      return data[index]["option_table"];
    },
    getTimeEpoch(oldEpoch, newTime) {
      const lastDate = new Date(oldEpoch);
      const strArray = newTime.split(":");
      lastDate.setHours(parseInt(strArray[0]));
      lastDate.setMinutes(parseInt(strArray[1]));
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
    },
    lastPriceString(price, epoch, lastEpoch) {
      if ((typeof price === 'undefined') || (price.length === 0)) return price;
      const dtime = Math.floor((epoch - lastEpoch) / 1000);
      if (dtime > 2592000 ) return price + " [---]";
      if (dtime < 1) return price;
      if (dtime < 60) return price + ' [' + dtime + '"]';
      if (dtime <3600) {
        const mins = Math.round(dtime / 60);
        return price + ' [' + mins + "']";
      }
      if (dtime < 86400) {
        const hours = Math.round(dtime / 60 / 60);
        return price + ' [' + hours + "h]";
      }
      const days = Math.round(dtime / 60 / 60 / 24);
      return price + ' [' + days + "d]";
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