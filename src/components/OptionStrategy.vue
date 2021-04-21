<template>
    <div style="padding: 10px 0px 0px 0px;">
        <b-container fluid>
            <b-row cols=5 class='px-2'>
                <b-col class='px-1'> 
                    <option-card 
                        title="Option #1" 
                        :expirationArray="expirationArray"
                        :prices="optionPrices"
                        :dataChanged="dataChanged" 
                        @nodata="nodata" />
                </b-col>
                <b-col class='px-1'> 
                    <option-card 
                        title="Option #2" 
                        :expirationArray="expirationArray"
                        :prices="optionPrices"
                        :dataChanged="dataChanged"
                        @nodata="nodata" />
                </b-col>
                <b-col class='px-1'> 
                    <option-card 
                        title="Option #3" 
                        :expirationArray="expirationArray"
                        :prices="optionPrices"
                        :dataChanged="dataChanged"
                        @nodata="nodata" />
                </b-col>
                <b-col class='px-1'> 
                    <option-card 
                        title="Option #4" 
                        :expirationArray="expirationArray"
                        :prices="optionPrices"
                        :dataChanged="dataChanged"
                        @nodata="nodata" />
                </b-col>
                <b-col class='px-1'> 
                    <option-card title="Futures" /> 
                </b-col>
            </b-row>
        </b-container>
    </div>
</template>

<script>
import OptionCard from './OptionCard.vue';

export default {
    name: "OptionStrategy",
    components: { OptionCard },
    emits: ["nodata"],
    props: ["expirationArray", "currentEpoch", "optionsData", "dataChanged"],
    data() {
        return {
            optionPrices: [],
        }
    },
    watch: {
        dataChanged(newData, oldData) {
            this.parseOptionData();
        },
    },
    methods: {
        parseOptionData() {
            if (!this.$props.optionsData) {
                this.optionPrices = [];
                return;
            }
            // cycle over all options (by expiration)
            for (let i=0; i<this.$props.optionsData.length; i++) {
                if (!this.$props.optionsData[i]) continue;

                if (this.$props.optionsData[i].length === 0) {
                    this.optionPrices[i] = [[], []];
                    continue;
                }

                let index = this.findIndex(this.$props.optionsData[i], this.$props.currentEpoch);
                const slicedTable = this.$props.optionsData[i][index]['option_table'];
                const table = slicedTable.map(a => Object.assign({}, a));

                let strikeArray = []
                // cycle over option table rows (strikes)
                for (let x=0; x<table.length; x++) {
                    if (x === table.length / 2) 
                        strikeArray.push({html: '<b>'+table[x]['strike']+'</b>', value: x});
                    else strikeArray.push({text: table[x]['strike'], value: x});
                }
                this.optionPrices[i] = [strikeArray, table];
            }
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
        nodata(payload) {
            this.$emit("nodata", payload);
        },
    }
}
</script>

<style>
</style>
