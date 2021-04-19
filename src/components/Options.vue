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
                    <line-chart 
                        :chart-data="volatilityCurveData"
                        :options="lineChartSettings"
                        :styles="lchart_style">
                    </line-chart>
                    </div>
                    <div :style="{ width:lchart_width + 'px' }">
                    <line-chart 
                        :chart-data="volatilityHistoryData"
                        :options="timeChartSettings"
                        :styles="lchart_style">
                    </line-chart>
                    </div>
                </div>
          </b-tab>
          <b-tab title="Strategy">
            <p>Strategy here...</p>
          </b-tab>
        </b-tabs>
    </div>
</template>

<script>
import OptionsTable from "./OptionsTable.vue";
import LineChart from './LineChart.vue'

export default {
  name: "Options",
  components: {
    OptionsTable, LineChart
  },
  props: ["choosenDate", "choosenTime", "baseAsset", "choosenFutures"],
  data() {
        return {
            choosenOption: -1,
            optionsDescriptionArray: [],
            optionsExpirationArray: [],
            optionDataIndex: 0,
            optionsData: [],
            optionsTableData: [],
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
    choosenDate(newDate, oldDate) {
        this.optionsTableBusy = true;
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
                console.log(error);
                this.choosenOptions = -1;
                this.optionsExpirationArray = [];
                this.optionsDescriptionArray = [];
                this.optionsData = [];
                this.optionsTableData = [];
                this.optionsTableDataChanged = !this.optionsTableDataChanged;
                this.optionsTableBusy = false;
                return "error";
            });
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
    onResize(event) {
      this.width = window.innerWidth - 320;
      this.height = this.width * 3 / 10;
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
                    console.log("Got error:" + error);
                    this.optionsTableData = [];
                    this.optionsTableDataChanged = !this.optionsTableDataChanged;
                    this.optionsTableBusy = false;
                    this.volatilityCurve();
                });
      }
    },
    volatilityCurve() {
        this.volatilityCurveData = {};
        this.volatilityCurveData['labels'] = [];
        this.volatilityCurveData['datasets'] = [ {
                type: 'line',
                label: 'MOEX Volatility',
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                data: [],
                pointRadius: 0,
            },];
        if (this.optionsTableData.length === 0) return;
        const slicedTable = this.optionTableSlice(this.optionsTableData);
        for (let i=0; i<slicedTable.length; i++) {
            if (slicedTable[i]['call_iv'].length > 0) {
                this.volatilityCurveData['labels'].push(slicedTable[i]['strike']);
                this.volatilityCurveData['datasets'][0]['data'].push(slicedTable[i]['call_iv'])
            } else if (slicedTable[i]['put_iv'].length > 0) {
                this.volatilityCurveData['labels'].push(slicedTable[i]['strike']);
                this.volatilityCurveData['datasets'][0]['data'].push(slicedTable[i]['put_iv'])
            }
        }
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
            },];
        if (this.volatilityData.length === 0 || 
            this.volatilityData[this.choosenOption].length === 0) return;
        for (let i=0; i<this.volatilityData[this.choosenOption].length; i++) {
            this.volatilityHistoryData['labels'].push(this.volatilityData[this.choosenOption][i][0]);
            this.volatilityHistoryData['datasets'][0]['data'].push(this.volatilityData[this.choosenOption][i][1])
        }
    },
    fillData () {
        this.lineChartData = {
            labels: [0, 1, 2, 3, 4, 5],
            datasets: [ {
                type: 'line',
                label: 'Data One',
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                data: [25, 23, 20, 17, 21, 24],
                pointRadius: 0,
            }, {
                type: 'scatter',
                label: 'Data Two',
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgb(75, 192, 192)',
                data: [30, 20, 10, 25, 29, 30],
                radius: 6, 
                pointStyle: "triangle"
            }, {
                type: 'scatter',
                label: 'Data Three',
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                data: [27, 18, 0, 21, 19, 29],
                radius: 6, 
                pointStyle: "triangle",
                rotation: 180
            } ]
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
