require('chartjs-plugin-annotation');
const Chart = require('chart.js');
const React = require('react');
const merge = require('lodash/merge');
// const isEqual = require('lodash/isEqual');
const cloneDeep = require('lodash/cloneDeep');

//////////////////////////////////////////////////////////////////////////////////////////////////////

class BaseChartDataset {
    constructor(config={}) {
        Object.assign(this, merge({
            label           : '',
            data            : 0,
            borderWidth     : 2,
            borderColor     : `rgba(${config.rgb?config.rgb.join(','):'200,200,200'},1.0)`,
            backgroundColor	: `rgba(${config.rgb?config.rgb.join(','):'200,200,200'},0.0)`,
            pointBorderColor: `rgba(${config.rgb?config.rgb.join(','):'200,200,200'},0.0)`,
        }, config));
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////

class BaseChart extends React.Component {
    constructor(props={}) {
        super(props);
        this.state = {
            type: 'line',
            data: {
                labels  : [],
                datasets: [],
            },
            options: {
                maintainAspectRatio: false,
                legend: {
                    position	: 'right',
                    display		: false,
                },
                title: {
                    position	: 'top',
                    display		: true,
                    text        : '',
                },
                scales: {
                    xAxis:[{
                        id	    : "x-axis-0",
                        type	: "category",
                        display	: true,
                    }],
                    yAxes:[{
                        id	    : "y-axis-0",
                        type	: "linear",
                        display	: true,
                        ticks   : {
                            // stepSize: 5000,
                            callback: (value)=>(`${value/10000}万`),
                        },
                        gridLines: {
                            color       : 'rgba(100,100,100,0.3)',
                            lineWidth   : 2,
                        },
                    }],
                },
                annotation: {
                    drawTime	: "afterDatasetsDraw",
                    annotations	: [{
                        id      	    : 'min',
                        yScaleID	    : 'y-axis-0',
                        type    	    : 'box',
                        yMax  		    : 0,
                        backgroundColor	: 'rgba(100,100,100,0.3)',
                    }],
                },
            },
        };
        this.chartRef = React.createRef();
        this.chart = undefined;
    }

    componentDidMount() {
        this.chart = new Chart(this.chartRef.current,this.generateConfig());
    }

    componentDidUpdate() {
        Object.assign(this.chart,this.generateConfig());
        this.chart.annotation.elements['min'].options.yMax = (this.props.sample||0);
        this.chart.update();
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     if (isEqual(nextProps,this.props)) {
    //         return false;
    //     }
    //     return true;
    // }

    generateConfig() {
        const {labels,datasets,title,max,sample} = this.props;
        const config = merge({},this.state,{
            data: {
                labels  : (labels||[]),
                datasets: (datasets||[]),
            },
            options: {
                title: {
                    text: (title||''),
                },
                scales: {
                    yAxes:[{
                        ticks: {
                            max: (Math.floor(max/5001)+1)*5000,
                        },
                    }],
                },
                annotation: {
                    annotations	: [{
                        yMax: (sample||0),
                    }],
                },
            },
        },this.props);
        // console.log({config});
        return config;
    }

    render() {
        const {className} = this.props;
        return (
<div className={className||''}>
    <canvas ref={this.chartRef} />
</div>
        );
    }
}
BaseChart.Dataset = BaseChartDataset;
Object.assign(module.exports,{BaseChart});
