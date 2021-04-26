<script>

import { Overlay } from 'trading-vue-js'

export default {
    name: 'Square',
    mixins: [Overlay],
    methods: {
        meta_info() {
            return { author: 'nullquant', version: '0.3.16' }
        },
        use_for() { return ['Square'] },
        draw(ctx) {
            const layout = this.$props.layout;
            const data = this.$props.data;

            for (var p of data) {
                let x0 = layout.t2screen(p[0])
                let x1 = layout.t2screen(p[1])
                let y0 = layout.$2screen(p[2])
                let y1 = layout.$2screen(p[3])
                ctx.strokeStyle = p[4];
                ctx.fillStyle = p[4];
                ctx.beginPath();
                //ctx.rect(x - dx / 2, y - dPrice / 2, dx, dPrice);
                ctx.fillRect(x0, y0, x1 - x0, y0 - y1);
                ctx.stroke();
            }
        },
        legend(values) {
            const data = this.$props.data;
            for (var p of data) {
                if (this.$props.cursor.t < p[0]) continue;
                if (this.$props.cursor.t > p[1]) continue;
                if (this.$props.cursor.y$ < p[2]) continue;
                if (this.$props.cursor.y$ > p[3]) continue;
                if (p[5][0] === '-') return [{ value: p[5], color: "rgb(229,65,80)"}];
                else return [{ value: p[5], color: "rgba(35,167,118)"}];
            }
            return [{ value: values[5], color: values[4] }];
        },
    },
    computed: {
        sett() {
            return this.$props.settings
        },
    },
    data() {
        return {
        }
    }
}
</script>
