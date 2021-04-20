<template>
    <div>
        <b-tabs style="padding: 20px 0px 0px 0px">
          <b-tab title="Options Table">
            <div class="radio-group" v-if="choosenOption!=-1">
                <b-form-radio-group class="radio-buttons"
                id="chain-buttons"
                v-model="choosenOption"
                :options="optionsExpirationArray"
                name="option-chain-buttons"
                buttons
                ></b-form-radio-group>
            </div>
            <options-table
              :choosenTime="choosenTime"
              :optionsData="optionsTableData"
              :dataChanged="optionsTableDataChanged"
              :tableBusy="optionsTableBusy"
            />
          </b-tab>
          <b-tab title="Volatility">
                <div class="radio-group" v-if="choosenOption!=-1">
                    <b-form-radio-group class="radio-buttons"
                    id="chain-buttons"
                    v-model="choosenOption"
                    :options="optionsExpirationArray"
                    name="option-chain-buttons"
                    buttons
                    ></b-form-radio-group>
                </div>
                <div class="vol-chart" :style="{ height:lchart_height + 'px' }">
                    <div :style="{ width:lchart_width + 'px' }">
                    <scatter
                        :chart-data="volatilityCurveData"
                        :options="lineChartSettings"
                        :styles="lchart_style">
                    </scatter>
                    </div>
                    <div :style="{ width:lchart_width + 'px' }">
                    <scatter
                        :chart-data="volatilityHistoryData"
                        :options="timeChartSettings"
                        :styles="lchart_style">
                    </scatter>
                    </div>
                </div>
          </b-tab>
          <b-tab title="Strategy">
            <div style="padding: 10px 0px 0px 0px;">
                <b-container fluid>
                    <b-row cols=5 class='px-2'>
                        <b-col class='px-1'> <option-card title="Option #1"></option-card> </b-col>
                        <b-col class='px-1'> <option-card title="Option #2"></option-card> </b-col>
                        <b-col class='px-1'> <option-card title="Option #3"></option-card> </b-col>
                        <b-col class='px-1'> <option-card title="Option #4"></option-card> </b-col>
                        <b-col class='px-1'> <option-card title="Futures"></option-card> </b-col>
                    </b-row>
                </b-container>
            </div>
          </b-tab>
        </b-tabs>
    </div>
</template>

<script>
import OptionsTable from "./OptionsTable.vue";
import Scatter from './LineChart.vue'
import GBS from './gbs.js'
import OptionCard from './OptionCard.vue'

export default {
  name: "Options",
  components: {
    OptionsTable, Scatter, OptionCard
  },
  props: ["choosenDate", "choosenTime", "baseAsset", "choosenFutures"],
  data() {
        return {
            choosenOption: -1,
            optionsDescriptionArray: [],
            optionsExpirationArray: [],
            optionDataIndex: 0,
            optionsData: [], // all options
            optionsTableData: [], // selected option
            optionsTableDataChanged: false,
            optionsTableBusy: false,
            width: window.innerWidth - 320,
            height: (window.innerWidth - 320) * 3 / 10,
            volatilityCurveData: {},
            volatilityData: [],
            volatilityHistoryData: {},
            lineChartSettings: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: false },
                scales: {
                    xAxes: [{
                        gridLines: { 
                            display: true,
                            color: "#2F3240",
                            zeroLineColor: "#838383" 
                        },
                        ticks: { 
                            fontColor: "#DEDDDD",
                        },
                    }],
                    yAxes: [{
                        gridLines: {
                            display: true,
                            color: "#2F3240",
                            zeroLineColor: "#838383" 
                        },
                        ticks: { 
                            fontColor: "#DEDDDD",
                            beginAtZero:true 
                        },
                    }]
                }
            },
            timeChartSettings: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: false },
                scales: {
                    xAxes: [{
                        type: 'time',
                        time: { unit: 'day' },
                        gridLines: { 
                            display: true,
                            color: "#2F3240",
                            zeroLineColor: "#838383" 
                        },
                        ticks: { 
                            fontColor: "#DEDDDD",
                        },
                    }],
                    yAxes: [{
                        gridLines: {
                            display: true,
                            color: "#2F3240",
                            zeroLineColor: "#838383" 
                        },
                        ticks: { 
                            fontColor: "#DEDDDD",
                            beginAtZero:true 
                        },
                    }]
                }
            }
        };
  },
  computed: {
      lchart_style() {
          return {
            height: this.lchart_height + 'px',   
            position: 'relative',
          };
      },
      lchart_width() {
        return Math.floor(this.width / 2);
      },
      lchart_height() {
          return Math.floor(this.height);
      },
  },  
  watch: {
    baseAsset(newAsset, oldAsset) {
        this.optionsTableBusy = true;
        this.loadOptions()
    },
    choosenDate(newDate, oldDate) {
        this.optionsTableBusy = true;
        this.loadOptions()
    },
    choosenOption(newOption, oldOption) {
        this.optionsTableBusy = true;
        this.loadOptionTable();
    },
    choosenTime(newTime, oldTime) {
        this.volatilityCurve();
    }
  }, 
  methods: {
    loadOptions() {
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
                        (eDate.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24));
                    const textDate = eDate.toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })
                    .slice(0, -3) + " [" + remain + "]";
                    this.optionsExpirationArray.push({ text: textDate, value: i});
                }
                this.optionsData = new Array(this.optionsDescriptionArray.length);
                this.choosenOption = 0;
                // loadOptionTable will be called in watch(choosenOption)
                // this.loadOptionTable(); 
                return "done";
            }
            console.log("Got error: " + response.data);
            this.choosenOption = -1;
            this.optionsExpirationArray = [];
            this.optionsDescriptionArray = [];
            this.optionsData = [];
            this.optionsTableData = [];
            this.optionsTableDataChanged = !this.optionsTableDataChanged;
            this.optionsTableBusy = false;
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
                this.choosenOption = -1;
                this.optionsExpirationArray = [];
                this.optionsDescriptionArray = [];
                this.optionsData = [];
                this.optionsTableData = [];
                this.optionsTableDataChanged = !this.optionsTableDataChanged;
                this.optionsTableBusy = false;
                return "error";
            });
    },
    loadOptionTable() {
      // No date selected or error
      if (this.choosenOption < 0) {
            this.optionsTableBusy = false;
            this.optionsTableData = [];
            this.optionsTableDataChanged = !this.optionsTableDataChanged;
            this.volatilityCurve();
            return;
      }
      // Has data for selected option
      if (this.optionsData[this.choosenOption]) {
            this.optionsTableData = this.optionsData[this.choosenOption];
            this.optionsTableDataChanged = !this.optionsTableDataChanged;
            this.optionsTableBusy = false;
            this.volatilityCurve();
            this.volatilityHistory();
            return;
      } else  {
            const query = "http://localhost:5000/api/v1/options/tables?sec=" + 
                this.optionsDescriptionArray[this.choosenOption][1] + "&asset=" + 
                this.optionsDescriptionArray[this.choosenOption][3] + "&date=" + 
                this.choosenDate;
            this.$axios.get(query)
                .then((response) => {
                    if (response.status != 200) {
                        console.log("Got error: " + response.data);
                        this.optionsTableData = [];
                    } else {
                        this.optionsData[this.choosenOption] = response.data[0];
                        this.volatilityData[this.choosenOption] = response.data[1];
                        console.log("Got options tables [" + this.optionsData[this.choosenOption].length + "]");
                        this.optionsTableData = this.optionsData[this.choosenOption];
                    }
                    this.optionsTableDataChanged = !this.optionsTableDataChanged;
                    this.optionsTableBusy = false;
                    this.volatilityCurve();
                    this.volatilityHistory();
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
                    this.optionsTableData = [];
                    this.optionsTableDataChanged = !this.optionsTableDataChanged;
                    this.optionsTableBusy = false;
                    this.volatilityCurve();
                });
      }
    },
    volatilityCurve() {
        this.volatilityCurveData= { datasets: [{
                type: 'line',
                label: 'MOEX Volatility',
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                data: [],
                spanGaps: true,
                pointRadius: 0,
            }, {
                type: 'scatter',
                label: 'Call Bid volatility',
                fill: true,
                borderColor: '#23A776',
                backgroundColor: '#23A776',
                data: [],
                radius: 6, 
                pointStyle: "triangle"
            }, {
                type: 'scatter',
                label: 'Call Ask Volatility',
                fill: true,
                borderColor: '#23A776',
                data: [],
                radius: 6, 
                pointStyle: "triangle",
                rotation: 180
            }, {
                type: 'scatter',
                label: 'Put Bid volatility',
                fill: true,
                borderColor: '#E54150',
                backgroundColor: '#E54150',
                data: [],
                radius: 6, 
                pointStyle: "triangle"
            }, {
                type: 'scatter',
                label: 'Put Ask Volatility',
                fill: true,
                borderColor: '#E54150',
                data: [],
                radius: 6, 
                pointStyle: "triangle",
                rotation: 180
            } ]};

        if (this.optionsTableData.length === 0) return;

        const slicedTable = this.optionTableSlice(this.optionsTableData);

        const fs = parseFloat(this.optionsTableData[this.optionDataIndex]["asset"]);

        const timezone = new Date(1970, 0, 1).getTime()
        const firstTradingDay = new Date(this.optionsDescriptionArray[this.choosenOption][4]).valueOf() + timezone;
        let lastTradingDay = new Date(this.optionsDescriptionArray[this.choosenOption][5]).valueOf() + timezone;
        const tradingDays = (lastTradingDay - firstTradingDay) /(1000 * 60 * 60 * 24);
        if (tradingDays > 30 && this.$props.baseAsset.startsWith("Si")) lastTradingDay += 14 * 60 * 60 * 1000;
        else  lastTradingDay += 18 * 60 * 60 * 1000 + 50 * 60 * 1000;
        const currentEpoch = this.getTimeEpoch(this.optionsTableData[0]["epoch"], this.$props.choosenTime);
        const t = (lastTradingDay - currentEpoch) / (1000 * 60 * 60 * 24 * 365);

        var v;

        var moexData = [];
        var maxVolatility = 0;
        for (let i=0; i<slicedTable.length; i++) {
            if (slicedTable[i]['call_iv'].length > 0) {
                moexData.push({x: slicedTable[i]['strike'], y: slicedTable[i]['call_iv']});
                maxVolatility = Math.max(maxVolatility, parseFloat(slicedTable[i]['call_iv']));
            } else if (slicedTable[i]['put_iv'].length > 0) {
                moexData.push({x: slicedTable[i]['strike'], y: slicedTable[i]['put_iv']});
                maxVolatility = Math.max(maxVolatility, parseFloat(slicedTable[i]['put_iv']));
            }
        }

        var callBidData = [];
        var callAskData = [];
        var putBidData = [];
        var putAskData = [];
        for (let i=0; i<slicedTable.length; i++) {
            const x = parseFloat(slicedTable[i]['strike'])

            if (slicedTable[i]['call_bid'].length > 0) {
                const cp = parseFloat(slicedTable[i]['call_bid']);
                if (cp >= GBS.black_76('c', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('c', fs, x, t, 0, cp);
                else v = 0.0;
                v = Math.round(v * 10000)/100;
                if (v < maxVolatility * 2) callBidData.push({x: x, y: v});
            }

            if (slicedTable[i]['call_ask'].length > 0) {
                const cp = parseFloat(slicedTable[i]['call_ask']);
                if (cp >= GBS.black_76('c', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('c', fs, x, t, 0, cp);
                else v = 0.0;
                v = Math.round(v * 10000)/100;
                if (v < maxVolatility * 2) callAskData.push({x: x, y: v});
            }

            if (slicedTable[i]['put_bid'].length > 0) {
                const cp = parseFloat(slicedTable[i]['put_bid']);
                if (cp >= GBS.black_76('p', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('p', fs, x, t, 0, cp);
                else v = 0.0;
                v = Math.round(v * 10000)/100;
                if (v < maxVolatility * 2) putBidData.push({x: x, y: v});
            }

            if (slicedTable[i]['put_ask'].length > 0) {
                const cp = parseFloat(slicedTable[i]['put_ask']);
                if (cp >= GBS.black_76('p', fs, x, t, 0, 0.005)[0]) v = GBS.euro_implied_vol_76('p', fs, x, t, 0, cp);
                else v = 0.0;
                v = Math.round(v * 10000)/100;
                if (v < maxVolatility * 2) putAskData.push({x: x, y: v});
            }
        }
        this.volatilityCurveData['datasets'][0]['data'] = moexData;
        this.volatilityCurveData['datasets'][1]['data'] = callBidData;
        this.volatilityCurveData['datasets'][2]['data'] = callAskData;
        this.volatilityCurveData['datasets'][3]['data'] = putBidData;
        this.volatilityCurveData['datasets'][4]['data'] = putAskData;
    },
    volatilityHistory() {
        this.volatilityHistoryData = {};
        this.volatilityHistoryData['labels'] = [];
        this.volatilityHistoryData['datasets'] = [ {
                type: 'line',
                label: 'History Volatility',
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                data: [],
                pointRadius: 0,
            }];
        if (this.volatilityData.length === 0 || 
            this.volatilityData[this.choosenOption].length === 0) return;
        for (let i=0; i<this.volatilityData[this.choosenOption].length; i++) {
            this.volatilityHistoryData['labels'].push(this.volatilityData[this.choosenOption][i][0]);
            this.volatilityHistoryData['datasets'][0]['data'].push(this.volatilityData[this.choosenOption][i][1])
        }
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
    onResize(event) {
      this.width = window.innerWidth - 320;
      this.height = this.width * 3 / 10;
    },
  },
  mounted() {
    window.addEventListener("resize", this.onResize);
    this.onResize();
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
  },
};
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

.vol-chart {
  display: grid;
  grid-template-columns: 50% 50%;
  background-color: #131722;
}

</style>
