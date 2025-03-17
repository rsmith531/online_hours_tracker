<!-- ~/components/section/WorkTimeline.vue -->

<template>
    <div style="width: min-content;">
        <svg ref="timelineSvg"></svg>
    </div>
</template>

<script setup lang="ts">
import { select, scaleLinear, min, max, line } from "d3";

const props = defineProps({
    vertical: {
        type: Boolean,
        required: false,
        default: false,
    }
})

const timelineSvg = ref<SVGSVGElement | null>(null);

// constant value for a straight line
const yValue: number = 0;

// { time in minutes, a constant value for a straight horizontal line, time description }
const dummyData: { date: number, amount: number, type: string }[] = [
    // small lead value for styling
    { date: 8 * 60, amount: yValue, type: 'padding' }, // 8:00a
    // start work
    { date: 8 * 60 + 30, amount: yValue, type: 'begin workday' }, // 8:30a
    // simulate break
    { date: 11 * 60, amount: yValue, type: 'begin break' }, // 11:00a
    { date: 11 * 60 + 20, amount: yValue, type: 'end break' }, // 11:20a
    // simulate expected 8 hour day
    { date: 16 * 60 + 50, amount: yValue, type: 'expected workday' }, // 4:50p
    // actual time off work
    { date: 18 * 60 + 22, amount: yValue, type: 'end workday' }, // 6:22p
    // small lag value for styling
    { date: 18 * 60 + 22 + 30, amount: yValue, type: 'padding' }, // 6:52p
];

onMounted(() => {
    console.log(`[WorkTimeline] ============================`)
    if (timelineSvg.value) {
        // instantiate the d3 chart
        const width = props.vertical === false ? 800 : 100;
        const height = props.vertical === false ? 100 : 800;
        const svg = select(timelineSvg.value)
            .attr("width", width)
            .attr("height", height);

        // scale the time in minutes to the dimensions of the chart container
        const minimumValue = min(dummyData, d => d.date)
        const maximumValue = max(dummyData, d => d.date)

        if (!minimumValue || !maximumValue) {
            throw new Error(`[WorkTimeline] could not determine minimum and maximum values: min ${minimumValue}, max: ${maximumValue}`)
        }

        // scaleLinear(domain, range(the dimension of the containing chart))
        const x = props.vertical
            ? scaleLinear([yValue, yValue], [0 + 10, width - 10])
            : scaleLinear([minimumValue, maximumValue], [0 + 10, width - 10]);
        // scale for the y axis
        const y = props.vertical
            ? scaleLinear([minimumValue, maximumValue], [20, height - 20])
            : scaleLinear([yValue, yValue], [height / 2, height / 2]);

        // declare the line generator
        const chartline = line<{ date: number, amount: number }>()
            .x(d => props.vertical ? x(d.amount) : x(d.date))
            .y(d => props.vertical ? y(d.date) : y(d.amount));

        /**
         * function to draw a line segment between two data points.
         *  
         * @param data the full data object of the line
         * @param startIndex where the line segment should begin
         * @param endIndex where the line segment should end
         * @param color what color the line segment should be
         */
        const drawSegment = (data: { date: number, amount: number }[], startIndex: number, endIndex: number, color: string) => {
            const segmentData = data.slice(startIndex, endIndex + 1);
            svg.append("path")
                .datum(segmentData)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 3)
                .attr("stroke-linecap", "round")
                .attr("transition", "all 0.7s ease-in-out;") // broken: should slowly transition line color when dark mode is toggled
                .attr("d", chartline(segmentData));
        };

        // example drawing line segments for dummy data
        //    active workday should be green
        //    workday past estimated 8 hours should be red
        //    break periods should be yellow
        //    padding segments and the segment between current work duration and estimated workday should be var(--p-panel-color)

        // draw the initial segment
        const beginWorkIndex = dummyData.findIndex(d => d.type === 'begin workday');
        drawSegment(dummyData, 0, beginWorkIndex, "var(--p-panel-color)");

        // draw the workday segment
        const beginBreakIndex = dummyData.findIndex(d => d.type === 'begin break');
        drawSegment(dummyData, beginWorkIndex, beginBreakIndex, "green");


        // draw the break segment
        const endBreakIndex = dummyData.findIndex(d => d.type === 'end break');
        drawSegment(dummyData, beginBreakIndex, endBreakIndex, "yellow");


        // draw the next workday segment
        const expectedIndex = dummyData.findIndex(d => d.type === 'expected workday');
        drawSegment(dummyData, endBreakIndex, expectedIndex, "green");


        // draw the overtime segment
        const endIndex = dummyData.findIndex(d => d.type === 'end workday');
        drawSegment(dummyData, expectedIndex, endIndex, "red");


        // draw the final segment
        drawSegment(dummyData, endIndex, dummyData.length - 1, "var(--p-panel-color)");

        // add tick marks for each data point
        const tickHeight = 20; // adjust this value to control the height of the ticks

        svg.selectAll("line.tick") // use a class to easily select the ticks
            .data(dummyData.slice(1, -1)) // minus the padding data points
            .enter()
            .append("line")
            .classed("tick", true) // add the class to the new lines

            // positioning
            .attr("x1", d => props.vertical ? width / 2 - tickHeight / 2 : x(d.date))
            .attr("y1", d => props.vertical ? y(d.date) : height / 2 - tickHeight / 2)
            .attr("x2", d => props.vertical ? width / 2 + tickHeight / 2 : x(d.date))
            .attr("y2", d => props.vertical ? y(d.date) : height / 2 + tickHeight / 2)

            // styling
            .attr("stroke", "var(--p-panel-color)")
            .attr("stroke-width", 3)
            .attr("stroke-linecap", "round");

        // add labels for each data point (excluding padding)
        const labelSpacing = 5; // adjust this value for spacing between label and line

        svg.selectAll("text.label")
            .data(dummyData.filter(d => d.type !== 'padding')) // don't label padding points
            .enter()
            .append("text")
            .classed("label", true)
            .attr("x", d => props.vertical
                // vertical label position
                ? width / 2 + tickHeight / 2 + labelSpacing // right of the line
                : x(d.date)
            )
            .attr("y", (d, i) => props.vertical
                ? y(d.date)
                : (
                    // horizontal label position
                    i % 2 === 0
                        ? height / 2 - tickHeight / 2 - labelSpacing - 5 // above the line
                        : height / 2 + tickHeight / 2 + labelSpacing + 15 // below the line
                )
            )
            .attr("dy", () => props.vertical ? "0.35rem" : 0)
            .attr("text-anchor", d => props.vertical ? "start" : "middle") // center the text
            .style("fill", "var(--p-panel-color)")
            .text(d => d.date);

    } else { console.error("[WorkTimeline] SVG ref is not available.") }

})
</script>