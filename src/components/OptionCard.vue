<template>
    <div class="o-card">
        <div class="o-card-body">
            <div class="container" fluid>
            <b-row class='px-0' align-v="center">
                <b-col col lg="3" class='px-0'>
                    <b-form-checkbox
                        @change="changeMethod"
                        v-model="checkedCall"
                        name="call"
                        switch > 
                        CALL
                    </b-form-checkbox>
                </b-col>
                <b-col col lg="3" class='px-0'>
                    <b-form-checkbox
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
                        :options="expirationArray" 
                        @change="changeExpiration" />
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
                    v-model="checkedWrite"
                    name="write"
                    switch >
                    WRITE
                </b-form-checkbox>
                </b-col>

                <b-col class='px-1 py-1'>
                    <b-form-select
                        size="sm"
                        v-model="selectedStrike"
                        :options="strikeArray" 
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
    name: "OptionCard",
    emits: ["quantity"],
    props: ["title", "expirationArray", "prices", "dataChanged", "clear"],
    data() {
        return {
            checkedCall: true,
            checkedPut: false,
            checkedBuy: true,
            checkedWrite: false,
            callPutArray: [true, false],
            buyWriteArray: [true, false],
            selectedExpiration: 0,
            strikeArray: [],
            selectedStrike: -1,
            quantity: 0,
            selectedPrice: 0,
            selectedSpread: 0,
            priceArray: [],
        };
    },
    watch: {
        dataChanged(newData, oldData) {
            this.changeExpiration();
        },
        selectedStrike(newData, oldData) {
            this.changeStrike();
        },
        quantity(newData, oldData) {
            this.sendLeg();
        },
        clear(newData, oldData) {
            this.quantity = 0;
        }
    },
    methods: {
        changeExpiration() {
            if (!this.$props.prices || !this.$props.prices[this.selectedExpiration]) {
                this.$store.dispatch('candles/loadOptionTable', this.selectedExpiration);
                this.strikeArray = [{ text: 'NO DATA', value: -1, disabled: true}];
                this.selectedStrike = -1;
            } else {
                let oldStrike;
                if (this.selectedStrike < 0) oldStrike = -1;
                else oldStrike = this.strikeArray[this.selectedStrike]['text'];

                const table = this.prices[this.selectedExpiration][0];
                let newStrikeArray = [];
                let newIndex = -1;
                for (let x = 0; x < table.length; x++) {
                    newStrikeArray.push({text: table[x]['strike'], value: x});
                    if (table[x]['strike'] === oldStrike) newIndex = x;
                }

                this.strikeArray = newStrikeArray;
                if (newIndex < 0) this.selectedStrike = this.strikeArray.length / 2 - 1;
                else this.selectedStrike = newIndex;
            }
            this.changeStrike();
        },
        changeMethod(checked) {
            if (this.checkedCall != this.callPutArray[0]) {
                this.checkedPut = !this.checkedPut;
                this.callPutArray = [this.checkedCall, this.checkedPut];
            } else if (this.checkedPut != this.callPutArray[1]) {
                this.checkedCall = !this.checkedCall;
                this.callPutArray = [this.checkedCall, this.checkedPut];
            } else if (this.checkedBuy != this.buyWriteArray[0]) {
                this.checkedWrite = !this.checkedWrite;
                this.buyWriteArray = [this.checkedBuy, this.checkedWrite];
            } else {
                this.checkedBuy = !this.checkedBuy;
                this.buyWriteArray = [this.checkedBuy, this.checkedWrite];
            }
            this.changeStrike();
        },
        changeStrike() {
            if (!this.$props.prices || !this.$props.prices[this.selectedExpiration] ||
                this.prices[this.selectedExpiration][1].length === 0) {
                this.priceArray = [{ text: 'NO DATA', value: -1, disabled: true}];
                this.selectedPrice = -1;
                this.selectedSpread = 0;
                this.quantity = 0;
                return;
            }

            var bid, mid, ask, bidValue, askValue, cp;

            if (this.checkedCall) {
                bid = this.prices[this.selectedExpiration][0][this.selectedStrike]['call_bid'];
                mid = this.prices[this.selectedExpiration][0][this.selectedStrike]['call_mid'];
                ask = this.prices[this.selectedExpiration][0][this.selectedStrike]['call_ask'];
                cp = -10;
            } else {
                bid = this.prices[this.selectedExpiration][0][this.selectedStrike]['put_bid'];
                mid = this.prices[this.selectedExpiration][0][this.selectedStrike]['put_mid'];
                ask = this.prices[this.selectedExpiration][0][this.selectedStrike]['put_ask'];
                cp = -20;
            }

            if (bid.length === 0) {
                this.priceArray = [{ text: 'NO DATA', value: -1+cp, disabled: true}];
                bidValue = -11;
            } else {
                this.priceArray = [{ text: bid, value: bid}];
                bidValue = bid;
            }
            if (mid.length === 0) {
                this.priceArray.push({ text: 'NO DATA', value: -2+cp, disabled: true});
            } else {
                this.priceArray.push({ text: mid, value: mid});
            }
            if (ask.length === 0) {
                this.priceArray.push({ text: 'NO DATA', value: -3+cp, disabled: true});
                askValue = -13;
            } else {
                this.priceArray.push({ text: ask, value: ask});
                askValue = ask;
            }

            if (askValue < 0 || bidValue < 0) this.selectedSpread = 0.2;
            else this.selectedSpread = (parseFloat(askValue) - parseFloat(bidValue)) / parseFloat(mid);

            if (this.checkedBuy) this.selectedPrice = askValue;
            else this.selectedPrice = bidValue;

            if (this.selectedPrice < 0) this.quantity = 0;
            if (this.quantity > 0) this.sendLeg();
        },
        changePrice() {
            if (this.quantity > 0) this.sendLeg();
        },
        sendLeg() {
            var strike;
            if (!this.$props.prices || !this.$props.prices[this.selectedExpiration] ||
                !this.prices[this.selectedExpiration][0].length === 0) strike = '';
            else strike = this.prices[this.selectedExpiration][0][this.selectedStrike]['strike'];
            this.$emit("quantity", [this.selectedExpiration, 
                                    this.checkedCall,
                                    this.checkedBuy,
                                    strike, 
                                    this.selectedPrice,
                                    this.selectedSpread,
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
    margin: 10px 10px 0px 10px;
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
