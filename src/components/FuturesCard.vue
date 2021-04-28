<template>
    <div class="o-card">
        <div class="o-card-body">
            <div class="container" fluid>
            <b-row class='px-0' align-v="center">
                <b-col col lg="3" class='px-0'>
                    <b-form-checkbox v-if="false"
                        @change="changeMethod"
                        v-model="checkedCall"
                        name="call"
                        switch > 
                        CALL
                    </b-form-checkbox>
                </b-col>
                <b-col col lg="3" class='px-0'>
                    <b-form-checkbox v-if="false"
                        @change="changeMethod"
                        v-model="checkedPut"
                        name="put"
                        switch > 
                        PUT
                    </b-form-checkbox>
                </b-col>

                <b-col class='px-1 py-1'>
                    <b-form-select
                        size="sm"
                        v-model="selectedExpiration"
                        :options="expirationArray" />
                </b-col>
            </b-row>

            <b-row class='px-0' align-v="center">
                <b-col col lg="3" class='px-0'>
                <b-form-checkbox
                    @change="changeMethod"
                    v-model="checkedBuy"
                    name="buy"
                    switch >
                    BUY
                </b-form-checkbox>
                </b-col>
                <b-col col lg="3" class='px-0'>
                    <b-form-checkbox
                    @change="changeMethod"
                    v-model="checkedSell"
                    name="write"
                    switch >
                    SELL
                </b-form-checkbox>
                </b-col>

                <b-col class='px-1 py-1'>
                    <b-form-select :disabled="true"
                        size="sm"
                        v-model="selectedStrike"
                        />
                </b-col>

            </b-row>

            <b-row class='px-0' align-v="center">

                <b-col class='px-1 py-1'>
                    <b-form-spinbutton 
                        id="qty-sb" 
                        v-model="quantity" 
                        min="0" 
                        :max="(selectedPrice > 0) ? 100: 0" 
                        size="sm" />
                </b-col>

                <b-col class='px-1 py-1'>
                    <b-form-select
                        size="sm"
                        v-model="selectedPrice"
                        :options="priceArray" 
                        @change="changePrice" />
                </b-col>

            </b-row>

            </div>

        </div>
    </div>
</template>

<script>
export default {
    name: "FuturesCard",
    emits: ["nodata", "clear"],
    props: ["title"],
    data() {
        return {
            checkedCall: true,
            checkedPut: false,
            checkedBuy: true,
            checkedSell: false,
            buySellArray: [true, false],
            expirationArray: [ {text: 'Futures', value: 0} ],
            selectedExpiration: 0,
            selectedStrike: 0,
            quantity: 0,
            selectedPrice: 0,
            selectedSpread: 0,
            priceArray: [],
        };
    },
    computed: {
        lastPrice() { return this.$store.state.candles.lastPrice; },
        choosenFutures() { return this.$store.state.candles.choosenFutures; },
        choosenFuturesDTE() { return this.$store.state.candles.choosenFuturesDTE; },
    },
    watch: {
        lastPrice(newValue, oldValue) {
            this.changePrice();
        },
        choosenFutures(newValue, oldValue) {
            this.expirationArray = [ {text: this.choosenFutures, value: 0} ];
        },
        quantity(newData, oldData) {
            this.sendLeg();
        },
        clear(newData, oldData) {
            this.quantity = 0;
        }
    },
    methods: {
        changeMethod(checked) {
            if (this.checkedBuy != this.buySellArray[0]) {
                this.checkedSell = !this.checkedSell;
                this.buySellArray = [this.checkedBuy, this.checkedSell];
            } else {
                this.checkedBuy = !this.checkedBuy;
                this.buySellArray = [this.checkedBuy, this.checkedSell];
            }
            this.changePrice();
        },
        changePrice() {
            if (this.lastPrice === 0) {
                this.priceArray = [{ text: 'NO DATA', value: -1, disabled: true}];
                this.selectedPrice = -1;
                this.selectedSpread = 0;
                this.quantity = 0;
                return;
            }

            this.priceArray = [{ text: this.lastPrice, value: this.lastPrice}];
            this.selectedPrice = this.lastPrice;

            if (this.selectedPrice <= 0) this.quantity = 0;
            if (this.quantity > 0) this.sendLeg();
        },
        sendLeg() {
            this.$emit("quantity", [this.choosenFutures, 
                                    this.choosenFuturesDTE,
                                    this.checkedBuy,
                                    '', 
                                    this.selectedPrice,
                                    '',
                                    this.quantity]);
        }

    },
};
</script>

<style>
.o-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #1E222D;
    background-clip: border-box;
    border: 1px solid #434651;
    background-clip: border-box;
    border-radius: 10px;
}
.o-card-body {
    flex: 1 1 auto;
    min-height: 1px;
    padding: 10px;
}
.o-card-title {
    margin-bottom: 0.75rem;
}
</style>
