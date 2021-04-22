import { Overlay } from 'trading-vue-js'

export default {
    name: 'LinePNL',
    mixins: [Overlay],
    methods: {
        draw(ctx) { 
            const l = this.$props.layout
            const c = {
                x: l.width / 2,
                y: l.height / 2
            }
            ctx.lineWidth = 2
            ctx.strokeStyle = 'black'
            ctx.fillStyle = '#ffea03'
            // Strong Head
            ctx.beginPath()
            ctx.arc(c.x, c.y, 50, 0, Math.PI * 2, true)
            ctx.fill()
            ctx.stroke()
            ctx.fillStyle = 'white'
            ctx.strokeStyle = 'black'
            // Wild Grin
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.strokeStyle = 'black'
            if (this.woo) ctx.arc(c.x, c.y, 42, -Math.PI * 0.1, Math.PI * 1.1)
            let d = this.woo ? 0 : 0.15
            let w = this.woo ? 2 : 0
            ctx.arc(c.x, c.y - (27 - w), 42, Math.PI * 0.9 - d, +Math.PI * .1 + d, true)
            if (this.woo) ctx.fill()
            ctx.stroke()
            ctx.beginPath()
            ctx.lineWidth = 0.25
            if (!this.woo) ctx.arc(c.x, c.y + 15, 25, Math.PI * 0.45, Math.PI * .6)
            ctx.stroke()
            ctx.lineWidth = 0.15
            ctx.beginPath()
            ctx.strokeStyle = 'black'
            var s1 = Math.PI * .1
            var s2 = Math.PI * 0.15

            ctx.stroke()
            // Eagle eyes
            ctx.beginPath()
            ctx.fillStyle = 'black'
            ctx.strokeStyle = 'black'
            ctx.lineWidth = 1
            ctx.moveTo(c.x - 17, c.y - 5)
            ctx.arc(c.x - 17, c.y - 5, 3, 0, Math.PI * 2, true)
            ctx.fill()
            ctx.moveTo(c.x + 17, c.y - 5)
            ctx.arc(c.x + 17, c.y - 5, 3, 0, Math.PI * 2, true)
            ctx.fill()
            ctx.stroke()
            ctx.lineCap = "round"
            ctx.beginPath()
            ctx.lineWidth = 5
            ctx.stroke()
        },
        use_for() { return ['LinePNL'] },
        data_colors() { return ['yellow'] },
        mousemove(e) {
            const l = this.$props.layout
            const c = {
                x: l.width / 2,
                y: l.height / 2
            }
            if (
                (c.x - e.clientX) * (c.x - e.clientX) +
                (c.y - e.clientY) * (c.y - e.clientY) <
                42 * 42
            ) {
                this.woo = true
            } else {
                this.woo = false
            }
        },    
    },
    data() {
        // Define internal setting & constants here
        return {
            woo: false
        }
    }    
}