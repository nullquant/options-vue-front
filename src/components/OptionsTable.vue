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
        :fields="fields"
        :items="optionTable"
        :dark="true"
        head-variant="dark"
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
  props: ["choosenDate", "baseAsset"],
  data() {
    return {
      choosedOption: -1,
      optionsArray: [],
      fields: [
          { key: 'call_bid', label: 'Bid' },
          { key: 'call_last', label: 'Last' },
          { key: 'call_ask', label: 'Ask' },
          { key: 'strike', label: 'Strike' },
          { key: 'put_bid', label: 'Bid' },
          { key: 'put_last', label: 'Last' },
          { key: 'put_ask', label: 'Ask' }
      ],
      optionTable: [
          { call_bid: '', call_last: 1200, call_ask: '', strike: 75500, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 76000, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 76500, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 77000, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 77500, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 78000, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 78500, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 79000, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 79500, put_bid: '', put_last: 1200, put_ask: ''},
          { call_bid: '', call_last: 1200, call_ask: '', strike: 80000, put_bid: '', put_last: 1200, put_ask: ''}
        ]
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