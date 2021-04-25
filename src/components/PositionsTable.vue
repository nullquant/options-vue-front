<template>
    <div class="table">
        <b-table 
            ref="ptable"
            :fields="fields"
            :items="positionsTable"
            :dark="true"
            head-variant="dark"
            small>
        </b-table>
    </div>
</template>

<script>
export default {
    name: "PositionsTable",
    components: {},
    props: ["prices", "strategy", "dataChanged"],
    data() {
        return {
            fields: [
                { key: 'secid', label: 'Security' },  // Si76000BCB1
                { key: 'type', label: 'Type' },    // Call | Put | Futures
                { key: 'direction', label: 'Action' },  // Buy | Write | Sell
                //{ key: 'expiration', label: 'DOE' }, // 15.04.2021 [1]
                { key: 'strike', label: 'Strike' }, // 76000
                { key: 'iv', label: 'IV' }, // 17.23
                { key: 'delta', label: 'Delta' }, // 0.432
                { key: 'gamma', label: 'Gamma' }, // 1.34e-5
                { key: 'theta', label: 'Theta' }, // -17.563
                { key: 'vega', label: 'Vega' }, // 0.123
                { key: 'ev', label: 'EV' }, // 1000
                { key: 'dte', label: 'DTE' }, // 6
                { key: 'open_price', label: 'Open' }, // 377 | (340)
                { key: 'quantity', label: 'Quantity' }, // 1
                { key: 'close_price', label: 'Close' }, // 
                { key: 'pnl', label: 'P&L' }, // (10)
            ],
            positionsTable: [],
        }
    },
    computed: {
        lastPrice() { return this.$store.state.candles.lastPrice; },
    },
    watch: {
        dataChanged(newData, oldData) {
            
            this.positionsTable = [];
            let summary = {'secid': '', 'type': '', 'direction': '', 'strike': '', 'iv': '', 
                           'delta': 0, 'gamma': 0, 'theta': 0, 'vega': 0, 'ev': 0, 'dte': '',
                           'open_price': 0, 'quantity': '', 'close_price': '', 'pnl': ''};
            for (let i = 0; i < this.$props.strategy.length; i++) {
                let leg = this.$props.strategy[i];
                if (!leg || leg.length === 0) continue;

                // strategy[0..4] :
                // secid, expiration index, call?, buy?, strike, price, spread, quantity
                // volatility, delta, gamma, theta, vega, rho, dte, t for evening clearings
                this.positionsTable.push({ 
                    "secid": leg[0].startsWith('si') ? 'Si' + leg[0].toUpperCase().substr(2) : leg[0].toUpperCase(),
                    "type": leg[2] ? "Call" : "Put",
                    "direction": leg[3] ? "Buy" : "Write",
                    "strike": leg[4],
                    "iv": (leg[8] * 100).toFixed(2),
                    "delta": leg[9].toFixed(3),
                    "gamma": Math.abs(leg[10]) > 0.01 ? leg[10].toFixed(3) : leg[10].toExponential(2),
                    "theta": Math.abs(leg[11]/365) > 1 ? (leg[11]/365).toFixed(0) : (leg[11]/365).toFixed(3),
                    "vega": Math.abs(leg[12]) > 1 ? leg[12].toFixed(0) : leg[12].toFixed(3),
                    "ev": leg[5] - (leg[2] ? Math.max(0, this.lastPrice - leg[4]) : Math.max(0, leg[4] - this.lastPrice)),
                    "dte": leg[14].toFixed(0),
                    "open_price": leg[5],
                    "quantity": leg[7],
                    "close_price": '',
                    "pnl": ''
                });

                summary['delta'] += leg[9];
                summary['gamma'] += leg[10];
                summary['theta'] += leg[11] / 365;
                summary['vega'] += leg[12];
                summary['ev'] += leg[5] - (leg[2] ? Math.max(0, this.lastPrice - leg[4]) : Math.max(0, leg[4] - this.lastPrice));
                summary['open_price'] += parseFloat(leg[5]);
            }

            summary['delta'] = summary['delta'].toFixed(3);
            summary['gamma'] = Math.abs(summary['gamma']) > 0.01 ? summary['gamma'].toFixed(3) : summary['gamma'].toExponential(2)
            summary['theta'] = Math.abs(summary['theta']) > 1 ? summary['theta'].toFixed(0) : summary['theta'].toFixed(3);
            summary['vega'] = Math.abs(summary['vega']) > 1 ? summary['vega'].toFixed(0) : summary['vega'].toFixed(3)

            this.positionsTable.push(summary);

            this.$refs.ptable.refresh();
        },
    },
    methods: {

    }
}
</script>


<style>
</style>
