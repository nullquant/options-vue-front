<template>
    <div>
        <b-tabs style="padding: 0px 0px 0px 0px" @input="changeTab">
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
                    :choosenOption="choosenOption"
                    :tableBusy="optionsTableBusy" />
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
                    :choosenOption="choosenOption" />
            </b-tab>
            <b-tab title="Strategy">
                <option-strategy 
                    :expirationArray="optionsExpirationArray"
                    :tabChanged="tabChanged" />
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
            optionsExpirationArray: [],
            tabChanged: false,
            optionsTableBusy: false,
        };
    },
    computed: {
        choosenBaseAsset() { return this.$store.state.candles.choosenBaseAsset; },
        choosenDate() { return this.$store.state.candles.choosenDate; },
        optionsDescriptionArray() { return this.$store.state.candles.optionsDescriptionArray; },
        optionsDescriptionUpdated() { return this.$store.state.candles.optionsDescriptionUpdated; },
        optionsTables() { return this.$store.state.candles.optionsTables; },
        optionsDataUpdated() { return this.$store.state.candles.optionsDataUpdated; },
    },
    watch: {
        choosenBaseAsset(newAsset, oldAsset) {
            this.optionsTableBusy = true;
            this.$store.dispatch('candles/loadOptions');
        },
        choosenDate(newDate, oldDate) {
            this.optionsTableBusy = true;
            this.$store.dispatch('candles/loadOptions');
        },
        optionsDescriptionUpdated(newValue, oldValue) {
            this.optionsExpirationArray = [];
            for (let i = 0; i < this.optionsDescriptionArray.length; i++) {
                const cDate = new Date(this.choosenDate);
                const eDate = new Date(this.optionsDescriptionArray[i][5]);
                const remain = Math.floor(
                    (eDate.getTime() - cDate.getTime()) / (1000 * 60 * 60 * 24));
                const textDate = eDate.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }).slice(0, -3) + " [" + remain + "]";
                this.optionsExpirationArray.push({ text: textDate, value: i});
            }
            if (this.optionsExpirationArray.length > 0) {
                if (this.choosenOption != 0) this.choosenOption = 0;
                else this.$store.dispatch('candles/loadOptionTable', this.choosenOption);
            } else this.optionsTableBusy = false; // error
        },
        choosenOption(newOption, oldOption) {
            if (this.choosenOption < 0) return;
            this.optionsTableBusy = true;
            this.$store.dispatch('candles/loadOptionTable', this.choosenOption);
        },
        optionsDataUpdated(newValue, oldValue) {
            this.optionsTableBusy = false;
        },
    }, 
    methods: {
        changeTab(tabIndex) {
            if (tabIndex == 2) this.tabChanged = this.tabChanged + 1;
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
