<template>
    <div class="o-card">
        <div class="o-card-body">
            <div class="container" fluid>

            <h4>{{title}}</h4>  

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
                    <b-form-spinbutton id="qty-sb" v-model="quantity" min="0" max="100" size="sm" />
                </b-col>

                <b-col class='px-1 py-1'>
                    <b-form-spinbutton id="price-sb" v-model="value" min="1" max="3000" size="sm" />
                </b-col>

            </b-row>

            </div>

        </div>
    </div>
</template>

<script>
export default {
    name: "OptionCard",
    emits: ["nodata"],
    props: ["title", "expirationArray", "prices", "dataChanged"],
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
            selectedStrike: 0,
            quantity: 0,
            value: 1

        };
    },
    watch: {
        dataChanged(newData, oldData) {
            this.changeExpiration();
        },
        selectedStrike(newData, oldData) {
            if (!this.prices[this.selectedExpiration][1].length === 0) {
                null;
            }

            // no data??
            if (this.checkedCall) {
                this.prices[this.selectedExpiration][1][this.selectedStrike]['call_bid']
                this.prices[this.selectedExpiration][1][this.selectedStrike]['call_ask']
            } else {
                this.prices[this.selectedExpiration][1][this.selectedStrike]['put_bid']
                this.prices[this.selectedExpiration][1][this.selectedStrike]['put_ask']
            }
        }
    },
    methods: {
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
        },
        changeExpiration() {
            if (!this.$props.prices || !this.$props.prices[this.selectedExpiration]) {
                this.$emit("nodata", this.selectedExpiration);
                this.strikeArray = []
            } else {
                this.strikeArray = this.prices[this.selectedExpiration][0];
                this.selectedStrike = this.strikeArray.length / 2 - 1;
            }
        },
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
    border-radius: 0.25rem;
}
.o-card-body {
    flex: 1 1 auto;
    min-height: 1px;
    padding: 1.25rem;
}
.o-card-title {
    margin-bottom: 0.75rem;
}
</style>
