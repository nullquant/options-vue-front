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
import GBS from './gbs.js'

export default {
    name: "PositionsTable",
    components: {},
    props: ["optionPrices", "strategy", "dataChanged"],
    data() {
        return {
            fields: [
                { key: 'secid', label: 'Security' },  // Si76000BCB1
                { key: 'opened', label: 'Opened' },  // Yes 
                { key: 'type', label: 'Type' },    // Call | Put | Futures
                { key: 'side', label: 'Side' },  // Buy | Write | Sell
                { key: 'strike', label: 'Strike' }, // 76000
                { key: 'iv', label: 'IV' }, // 17.23
                { key: 'delta', label: 'Delta' }, // 0.432
                { key: 'gamma', label: 'Gamma' }, // 1.34e-5
                { key: 'theta', label: 'Theta' }, // -17.563
                { key: 'vega', label: 'Vega' }, // 0.123
                { key: 'ev', label: 'EV' }, // 1000
                { key: 'dte', label: 'DTE' }, // 6
                { key: 'open_price', label: 'Price' }, // 377 | (340)
                { key: 'quantity', label: 'Quantity' }, // 1
                { key: 'close_price', label: 'Close' }, // 
                { key: 'pnl', label: 'P&L' }, // (10)
            ],
            positionsTable: [],
        }
    },
    computed: {
        currentEpoch() { return this.$store.state.candles.currentEpoch; },
        lastPrice() { return this.$store.state.candles.lastPrice; },
        positions() { return this.$store.state.candles.positions; },
        positionsUpdated() { return this.$store.state.candles.positionsUpdated; },
    },
    watch: {
        dataChanged(newData, oldData) { this.createPositionsTable(); },
        //positionsUpdated(newData, oldData) { this.createPositionsTable(); },
    },
    methods: {
        createPositionsTable() {

            console.log("PT: createPositionsTable");

            this.positionsTable = [];
            let summary = {'secid': '', 'opened':'', 'type': '', 'side': '', 'strike': '', 'iv': '', 
                           'delta': 0, 'gamma': 0, 'theta': 0, 'vega': 0, 'ev': '', 'dte': '',
                           'open_price': '', 'quantity': '', 'close_price': '', 'pnl': 0};

            for (let i = 0; i < this.positions.length; i++) {
                let position = this.positions[i];
                if (position['closed']) continue;

                this.addLine(position);

                summary['delta'] += position['greeks'][1] * position['quantity'];
                summary['gamma'] += position['greeks'][2] * position['quantity'];
                summary['theta'] += position['greeks'][3] / 365 * position['quantity'];
                summary['vega'] += position['greeks'][4] * position['quantity'];
                if (position['pnl'] && position['pnl'].length != 0) summary['pnl'] += position['pnl'];
            }

            for (let i = 0; i < this.$props.strategy.length; i++) {
                let position = this.$props.strategy[i];
                if (!position || position.length === 0 || position['quantity'] === 0) continue;

                this.addLine(position);

                summary['delta'] += position['greeks'][1] * position['quantity'];
                summary['gamma'] += position['greeks'][2] * position['quantity'];
                summary['theta'] += position['greeks'][3] / 365 * position['quantity'];
                summary['vega'] += position['greeks'][4] * position['quantity'];
                if (position['pnl'] && position['pnl'].length != 0) summary['pnl'] += position['pnl'];
            }

            summary['delta'] = summary['delta'].toFixed(3);
            summary['gamma'] = Math.abs(summary['gamma']) > 0.01 ? summary['gamma'].toFixed(3) : summary['gamma'].toExponential(2)
            summary['theta'] = Math.abs(summary['theta']) > 1 ? summary['theta'].toFixed(0) : summary['theta'].toFixed(3);
            summary['vega'] = Math.abs(summary['vega']) > 1 ? summary['vega'].toFixed(0) : summary['vega'].toFixed(3)

            this.positionsTable.push(summary);

            this.$refs.ptable.refresh();
        },
        addLine(position) {
            let greeks = position['greeks'];
            this.positionsTable.push({
                "secid": position['secid'].startsWith('si') ? 
                        'Si' + position['secid'].toUpperCase().substr(2) : position['secid'].toUpperCase(),
                "opened": position['opened'] ? "Yes" : "",
                "type": position['call?'] === 'F' ? 'Futures' : position['call?'] ? "Call" : "Put",
                "side": position['buy?'] ? "Buy" : position['call?'] === 'F' ? "Sell" : "Write",
                "strike": position['strike'],
                "iv": position['call?'] === 'F' ? '' : (greeks[0] * 100).toFixed(2),
                "delta": greeks[1].toFixed(3),
                "gamma": Math.abs(greeks[2]) > 0.01 ? greeks[2].toFixed(3) : greeks[2].toExponential(2),
                "theta": Math.abs(greeks[3]/365) > 1 ? (greeks[3]/365).toFixed(0) : (greeks[3]/365).toFixed(3),
                "vega": Math.abs(greeks[4]) > 1 ? greeks[4].toFixed(0) : greeks[4].toFixed(3),
                "ev": position['ev'],
                "dte": position['dte'].toFixed(0),
                "open_price": position['buy?'] ? parseFloat(position['open_price']) : -parseFloat(position['open_price']),
                "quantity": position['quantity'],
                "close_price": position['close_price'],
                "pnl": position['pnl']
            });
        },

    }
}
</script>


<style>
</style>
