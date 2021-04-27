<template>
    <div style="position: relative;">
        <b-table 
            ref="otable"
            :fields="fields"
            :items="optionsTable"
            :busy="tableBusy"
            :dark="true"
            head-variant="dark"
            small>
            <template #thead-top>
                <b-tr>
                    <b-th colspan="6">Calls</b-th>
                    <b-th></b-th>
                    <b-th colspan="6">Puts</b-th>
                </b-tr>
            </template>  
            <template #table-busy>
                <div class="text-center my-2">
                    <b-spinner class="align-middle" />
                </div>
            </template>          
        </b-table>
        <div style="position: absolute; top: 5px; right: 15px">
            {{ optionsTableTime }}
        </div>
    </div>
</template>

<script>
export default {
    name: "OptionsPanel",
    components: {},
    props: ["choosenOption", "tableBusy"],
    data() {
        return {
            fields: [
                { key: 'call_oi', label: 'OI' },
                { key: 'call_iv', label: 'IV' },
                { key: 'call_last', label: 'Last' },
                { key: 'call_bid', label: 'Bid' },
                { key: 'call_mid', label: 'Mid' },
                { key: 'call_ask', label: 'Ask' },
                { key: 'strike', label: 'Strike', tdClass: 'strike-border' },
                { key: 'put_bid', label: 'Bid' },
                { key: 'put_mid', label: 'Mid' },
                { key: 'put_ask', label: 'Ask' },
                { key: 'put_last', label: 'Last' },
                { key: 'put_iv', label: 'IV' },
                { key: 'put_oi', label: 'OI' }
            ],
            optionsTable: [],
            optionsTableTime: '27.04.2021 12:33:07'
        }
    },
    computed: {
        currentEpoch() { return this.$store.state.candles.currentEpoch; },
        optionsTables() { return this.$store.state.candles.optionsTables; },
        optionsDataUpdated() { return this.$store.state.candles.optionsDataUpdated; },
    },
    watch: {
        choosenOption(newValue, oldValue) {
            this.optionsTable = this.parseOptionData();
            this.$refs.otable.refresh();
        },
        optionsDataUpdated(newData, oldData) {
            this.optionsTable = this.parseOptionData();
            this.$refs.otable.refresh();
        },
    },
    methods: {
        parseOptionData() {
            if (this.$props.choosenOption < 0) return [];
            if (!this.optionsTables || !this.optionsTables[this.$props.choosenOption]) return;

            const slicedTable = this.optionsTables[this.$props.choosenOption]["option_table"];
            this.optionsTableTime = (new Date(this.optionsTables[this.$props.choosenOption]["epoch"]))
                                    .toLocaleString();

            let table = slicedTable.map(a => Object.assign({}, a));
            const epoch = this.currentEpoch;
            
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
</style>