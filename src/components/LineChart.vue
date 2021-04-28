<script>
import { Scatter, mixins } from 'vue-chartjs'

const { reactiveProp } = mixins

export default {
    extends: Scatter,
    mixins: [reactiveProp],
    props: ['options', "optionChanged"],
    mounted () {
        // this.chartData is created in the mixin.
        // If you want to pass options please create a local options object
        //this.renderChart(this.chartData, this.$props.options);
        this.renderChart(this.chartData, this.options);
    },
    watch: {
        chartData() {
            this.$data._chart.update();
        },
        optionChanged() {
            this.$data._chart.destroy()
            this.renderChart(this.chartData, this.options);
        }
    }      
}
</script>

<style>
</style>
