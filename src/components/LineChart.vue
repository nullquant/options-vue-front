<script>
import { Scatter, mixins } from 'vue-chartjs'
import chartjsPluginAnnotation from "chartjs-plugin-annotation"

const { reactiveProp } = mixins

export default {
    extends: Scatter,
    mixins: [reactiveProp],
    props: ['options', "optionChanged"],
    mounted () {
        //Arguments is an Array of Plugins (https://vue-chartjs.org/api/#addplugin)
        this.addPlugin([chartjsPluginAnnotation]);
        // this.chartData is created in the mixin.
        // If you want to pass options please create a local options object
        //this.renderChart(this.chartData, this.$props.options);
        this.renderChart(this.chartData, { ...this.options, 
                                           annotation: Object.assign({}, this.options.annotation)});
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
