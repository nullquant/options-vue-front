<template>
    <div>
        <b-tabs style="padding: 20px 0px 0px 0px" @input="changeTab">
            <b-tab title="Options Table">
                <div class="radio-group" v-if="choosenOption!=-1">
                    <b-form-radio-group class="radio-buttons"
                        id="chain-buttons"
                        v-model="choosenOption"
                        :options="optionsExpirationArray"
                        name="option-chain-buttons"
                        buttons />
                </div>
                <options-table
                    :optionsDataIndex="optionsDataIndex"
                    :optionsData="optionsData[choosenOption]"
                    :currentEpoch="currentEpoch"
                    :tableBusy="optionsTableBusy"
                    :dataChanged="dataChanged" />
            </b-tab>
            <b-tab title="Volatility">
                <div class="radio-group" v-if="choosenOption!=-1">
                    <b-form-radio-group class="radio-buttons"
                        id="chain-buttons2"
                        v-model="choosenOption"
                        :options="optionsExpirationArray"
                        name="option-chain-buttons2"
                        buttons />
                </div>
                <volatility-charts
                    :optionsDataIndex="optionsDataIndex"
                    :optionsData="optionsData[choosenOption]"
                    :volatilityData="volatilityData[choosenOption]"
                    :ivData="ivData[choosenOption]"
                    :optionTime="choosenOptionTime"
                    :dataChanged="dataChanged" />
            </b-tab>
            <b-tab title="Strategy">
                <option-strategy 
                    :expirationArray="optionsExpirationArray"
                    :descriptionArray="optionsDescriptionArray"
                    :currentEpoch="currentEpoch"
                    :optionsData="optionsData"
                    :dataChanged="dataChanged" 
                    @nodata="loadOptionTable($event)" 
                    @pnl="$emit('pnl', $event)" />
            </b-tab>
        </b-tabs>
    </div>
</template>

<script>
import OptionsTable from "./OptionsTable.vue";
import VolatilityCharts from './VolatilityCharts.vue';
import OptionStrategy from './OptionStrategy.vue';

export default {
    name: "Options",
    components: {
        OptionsTable, VolatilityCharts, OptionStrategy
    },
    data() {
        return {
            choosenOption: -1,
            optionsDescriptionArray: [],
            optionsExpirationArray: [],
            optionsDataIndex: 0,
            optionsData: [],
            volatilityData: [],
            ivData: [],
            dataChanged: false,
            currentEpoch: 0,
            choosenOptionTime: 0.1,
            optionsTableBusy: false,
        };
    },
    computed: {
        choosenBaseAsset() { return this.$store.state.candles.choosenBaseAsset; },
        choosenDate() { return this.$store.state.candles.choosenDate; },
        choosenTime() { return this.$store.state.candles.choosenTime; },
    },
    watch: {
        choosenBaseAsset(newAsset, oldAsset) {
            this.optionsTableBusy = true;
            this.loadOptions()
        },
        choosenDate(newDate, oldDate) {
            this.optionsTableBusy = true;
            this.loadOptions()
        },
        choosenTime(newTime, oldTime) {
            this.optionsTableBusy = true;
            this.searchOptionIndex(this.choosenOption);
        },
        choosenOption(newOption, oldOption) {
            this.optionsTableBusy = true;
            this.loadOptionTable(this.choosenOption);
        },
    }, 
    methods: {
        changeTab(tabIndex) {
            if (tabIndex == 2) this.dataChanged = !this.dataChanged;
        },
        loadOptions() {
            const query = "http://localhost:5000/api/v1/options?date=" + 
                this.choosenDate + "&q=" + this.choosenBaseAsset;
            this.$axios.get(query)
                .then((response) => {
                    if (response.status === 200) {
                        console.log("Got options data [" + 
                        response.data.length + "]");
                        this.optionsExpirationArray = [];
                        this.optionsDescriptionArray = response.data;
                        for (let i = 0; i < response.data.length; i++) {
                            const cDate = new Date(this.choosenDate);
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
                    this.optionsDataIndex = 0;
                    this.optionsData = [];
                    this.volatilityData = [];
                    this.ivData = [];
                    this.dataChanged = !this.dataChanged;
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
                    this.optionsDataIndex = 0;
                    this.optionsData = [];
                    this.volatilityData = [];
                    this.ivData = [];
                    this.dataChanged = !this.dataChanged;
                    this.optionsTableBusy = false;
                    return "error";
                });
        },
        loadOptionTable(selected) {
            // No date selected or error
            if (selected < 0) {
                    this.dataChanged = !this.dataChanged;
                    this.optionsTableBusy = false;
                    return;
            }
            // Has data for selected option
            if (this.optionsData[selected]) {
                    this.searchOptionIndex(selected);
                    return;
            } else  {
                    const query = "http://localhost:5000/api/v1/options/tables?sec=" + 
                        this.optionsDescriptionArray[selected][1] + "&asset=" + 
                        this.optionsDescriptionArray[selected][3] + "&date=" + 
                        this.choosenDate;
                    this.$axios.get(query)
                        .then((response) => {
                            if (response.status != 200) {
                                console.log("Got error: " + response.data);
                                this.optionsData[selected] = [];
                                this.volatilityData[selected] = [];
                                this.ivData[selected] = [];
                            } else {
                                this.optionsData[selected] = response.data[0];
                                this.volatilityData[selected] = response.data[1];
                                this.ivData[selected] = response.data[2];
                                console.log("Got options tables [" + this.optionsData[selected].length + "]");
                            }
                            this.searchOptionIndex(selected);
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
                            this.optionsData[selected] = [];
                            this.volatilityData[selected] = [];
                            this.ivData[selected] = [];
                            this.optionsDataIndex = 0;
                            this.dataChanged = !this.dataChanged;
                            this.optionsTableBusy = false;
                        });
                    }
            },
            searchOptionIndex(selected) {
                if (!this.optionsDescriptionArray[selected] || !this.optionsData[selected] ||
                    !this.optionsData[selected][0] || !this.optionsData[selected][0]["epoch"]) {
                    this.optionsDataIndex = 0;
                    this.currentEpoch = 0;
                    this.choosenOptionTime = 0.1;
                    this.dataChanged = !this.dataChanged;
                    this.optionsTableBusy = false;
                    return;
                }

                const data = this.optionsData[selected];
                this.currentEpoch = this.getTimeEpoch(data[0]["epoch"], this.choosenTime);

                const maxIndex = data.length - 1;
                if ((this.currentEpoch >= data[this.optionsDataIndex]["epoch"]) && 
                    (this.currentEpoch < data[Math.min(this.optionsDataIndex + 1, maxIndex)]["epoch"])) {
                        null;
                } else 
                if ((this.currentEpoch >= data[Math.min(this.optionsDataIndex + 1, maxIndex)]["epoch"]) && 
                    (this.currentEpoch < data[Math.min(this.optionsDataIndex + 2, maxIndex)]["epoch"])) {
                        this.optionsDataIndex = Math.min(this.optionsDataIndex + 1, maxIndex);
                } else this.optionsDataIndex = this.findIndex(data, this.currentEpoch);

                const timezone = new Date(1970, 0, 1).getTime();
                const firstTradingDay = new Date(this.optionsDescriptionArray[selected][4]).valueOf() + timezone;
                let lastTradingDay = new Date(this.optionsDescriptionArray[selected][5]).valueOf() + timezone;
                const tradingDays = (lastTradingDay - firstTradingDay) /(1000 * 60 * 60 * 24);
                if (tradingDays > 30 && this.choosenBaseAsset.startsWith("Si")) lastTradingDay += 14 * 60 * 60 * 1000;
                else  lastTradingDay += 18 * 60 * 60 * 1000 + 50 * 60 * 1000;

                this.choosenOptionTime = (lastTradingDay - this.currentEpoch) / (1000 * 60 * 60 * 24 * 365);

                this.dataChanged = !this.dataChanged;
                this.optionsTableBusy = false;
            },
            getTimeEpoch(oldEpoch, newTime) {
                const lastDate = new Date(oldEpoch);
                const strArray = newTime.split(":");
                lastDate.setHours(parseInt(strArray[0]));
                lastDate.setMinutes(parseInt(strArray[1]));
                return lastDate.valueOf();
            },
            findIndex(data, epoch) {
                let low = 0;
                let high = data.length;
                if (data[low]["epoch"] >= epoch) return low;
                let index = Math.floor((low + high) / 2);
                while(high - low > 1) {
                    if (data[index]["epoch"] === epoch) return index;
                    if (data[index]["epoch"] < epoch) low = index;
                    else high = index;
                    index = Math.floor((low + high) / 2);
                }
                if (data[high]["epoch"] === epoch) return high; 
                return low;
            },
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

</style>
