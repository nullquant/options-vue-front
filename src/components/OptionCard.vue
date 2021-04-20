<template>
  <div class="o-card">
    <div class="o-card-body">
        <div class="container" fluid>

          <b-row class='px-0' align-v="center">

              <b-col col lg="6" > <h4>{{title}}</h4> </b-col>

              <b-col class='px-1 py-1'> 
                <b-form-spinbutton id="qty-sb" v-model="value" min="0" max="30" size="sm"></b-form-spinbutton> 
              </b-col>

          </b-row>

          <b-row class='px-0' align-v="center">
            <b-col col lg="3" class='px-0'>
            <b-form-checkbox
              @change="changeMethod"
              v-model="checkedCall"
              name="call"
              switch
            > CALL
            </b-form-checkbox>
            </b-col>
            <b-col col lg="3" class='px-0'>
            <b-form-checkbox
              @change="changeMethod"
              v-model="checkedPut"
              name="put"
              switch
            > PUT
            </b-form-checkbox>
            </b-col>

            <b-col class='px-1 py-1'>
                <b-form-select
                  size="sm"
                  v-model="selectedExpiration"
                  :options="expirationArray"
                ></b-form-select>
            </b-col>
          </b-row>

          <b-row class='px-0' align-v="center">
            <b-col col lg="3" class='px-0'>
            <b-form-checkbox
              @change="changeMethod"
              v-model="checkedBuy"
              name="buy"
              switch
            > BUY
            </b-form-checkbox>
            </b-col>
            <b-col col lg="3" class='px-0'>
            <b-form-checkbox
              @change="changeMethod"
              v-model="checkedWrite"
              name="write"
              switch
            > WRITE
            </b-form-checkbox>
            </b-col>

            <b-col class='px-1 py-1'>
                <b-form-spinbutton id="price-sb" v-model="value" min="1" max="3000" size="sm"></b-form-spinbutton>
            </b-col>

          </b-row>
        </div>

    </div>
  </div>
</template>

<script>
export default {
  name: "OptionCard",
  props: ["title"],
  data() {
    return {
      checkedCall: true,
      checkedPut: false,
      checkedBuy: true,
      checkedWrite: false,
      callPutArray: [true, false],
      buyWriteArray: [true, false],
      selectedExpiration: '15.04.21[1]',
      expirationArray: ['15.04.21[1]', '22.04.21[8]', '29.04.21[15]', '20.05.21[36]', '17.06.21[64]', '16.12.21[246]', '17.03.22[337]'],

    };
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
