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

enum PointType {
    Padding = 'padding',
    Begin = 'Start',
    Current = 'Current',
    EstimatedEnd = 'Estimated',
    End = 'End',
    Pause = 'On Break',
    Unpause = 'Off Break'
}

const timelineSvg = ref<SVGSVGElement | null>(null);

// constant value for a straight line
const yValue: number = 0;

// points to render on timeline
const startTime: Date = new Date();
startTime.setHours(8, 30, 0, 0); // set to 8:30a
const startPadding: Date = new Date(startTime.getTime() - 30 * 60 * 1000);
const currentTime: Date = new Date();
// currentTime.setHours(14, 30, 0, 0); // set to 14:30a
const estimatedEndTime: Date = new Date(startTime.getTime() + 8 * 60 * 60 * 1000);
const endPadding: Date = new Date(Math.max(estimatedEndTime.getTime(), currentTime.getTime()) + 30 * 60 * 1000);

const dummyData: { date: Date, type: PointType }[] = [
    // small lead value for styling
    { date: startPadding, type: PointType.Padding },
    // start work
    { date: startTime, type: PointType.Begin },
    // simulated breaks
    { date: new Date(new Date().setHours(9, 0)), type: PointType.Pause }, // 9:00a
    { date: new Date(new Date().setHours(9, 50)), type: PointType.Unpause }, // 9:50a
    { date: new Date(new Date().setHours(11, 0)), type: PointType.Pause }, // 11:00a
    { date: new Date(new Date().setHours(11, 20)), type: PointType.Unpause }, // 11:20a
    // current working duration
    { date: currentTime, type: PointType.Current },
    // simulate expected 8 hour day
    { date: estimatedEndTime, type: PointType.EstimatedEnd },
    // small lag value for styling
    { date: endPadding, type: PointType.Padding },
];

onMounted(() => {
    console.log('[WorkTimeline] ============================')
    if (timelineSvg.value) {
        console.log(`[WorkTimeline] window.innerHeight: ${window.innerHeight}`)
        console.log(`[WorkTimeline] window.outerHeight: ${window.outerHeight}`)

        // instantiate the d3 chart
        const width = props.vertical === false ? 800 : 200;
        const height = props.vertical === false ? 100 : window.outerHeight;
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

        const y = props.vertical
            ? scaleLinear([minimumValue, maximumValue], [20, height - 20])
            : scaleLinear([yValue, yValue], [height / 2, height / 2]);

        // declare the line generator with the type of an element in the dummyData array
        const chartline = line<typeof dummyData[number]>()
            .x(d => props.vertical ? x(yValue) : x(d.date))
            .y(d => props.vertical ? y(d.date) : y(yValue));

        /**
         * function to draw a line segment between two data points.
         *  
         * @param data the full data object of the line
         * @param startIndex where the line segment should begin
         * @param endIndex where the line segment should end
         * @param color what color the line segment should be
         */
        const drawSegment = (data: typeof dummyData, startIndex: number, endIndex: number, color: string) => {
            const segmentData = [data[startIndex], data[endIndex]];
            svg.append("path")
                .datum(segmentData)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 3)
                .attr("stroke-linecap", "round")
                .attr("transition", "all 0.7s ease-in-out;") // broken: should slowly transition line color when dark mode is toggled
                .attr("d", chartline(segmentData));
        };

        // draw the relevant line segments on the chart

        // draw the start padding segment
        const beginWorkIndex = dummyData.findIndex(d => d.type === PointType.Begin);
        drawSegment(dummyData, 0, beginWorkIndex, "var(--p-panel-color)");

        // draw the workday segment to the closer value of expected or current index
        const currentIndex = dummyData.findIndex(d => d.type === PointType.Current);
        const expectedIndex = dummyData.findIndex(d => d.type === PointType.EstimatedEnd);
        drawSegment(dummyData, beginWorkIndex, dummyData[expectedIndex].date.getTime() < dummyData[currentIndex].date.getTime() ? expectedIndex : currentIndex, "var(--workday-active)");


        // draw the overtime segment starting from the expected end to the current index
        console.log(`[WorkTimeline] current date: ${dummyData[currentIndex].date}; type: ${dummyData[currentIndex].type}`)
        console.log(`[WorkTimeline] expected date: ${dummyData[expectedIndex].date}; type: ${dummyData[expectedIndex].type}`)
        if (dummyData[currentIndex].date > dummyData[expectedIndex].date) {
            drawSegment(dummyData, expectedIndex, currentIndex, "var(--workday-closed)");
        }

        // draw the end padding segment
        drawSegment(dummyData, currentIndex, dummyData.length - 1, "var(--p-panel-color)");

        // draw any paused segments
        for (let i = 0; i < dummyData.length; i++) {
            if (dummyData[i].type === PointType.Pause) {
                // find the next larger point.date value
                let nextPointIndex = -1;
                for (let j = i + 1; j < dummyData.length; j++) {
                    if (dummyData[j].type === PointType.Unpause) {
                        nextPointIndex = j;
                        break;
                    }
                }
                // use it to draw a yellow segment
                if (nextPointIndex === -1) {
                    // draw up to the currentIndex if there is no next unpause
                    drawSegment(dummyData, i, currentIndex, "var(--workday-paused)");
                } else {
                    drawSegment(dummyData, i, nextPointIndex, "var(--workday-paused)");
                }
            }
        }

        // add tick marks for each data point
        const tickHeight = 20;

        svg.selectAll("line.tick") // use a class to easily select the ticks
            .data(dummyData.filter(d => d.type !== 'padding')) // minus the padding data points
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

        // add labels for each data point
        const labelSpacing = 5;

        svg.selectAll("text.label")
            .data(dummyData.filter(d => d.type !== 'padding')) // minus the padding data points
            .enter()
            .append("text")
            .classed("label", true)
            .attr("x", (d, i) => props.vertical
                // vertical label position
                ? (i % 2 === 0
                    ? width / 2 + tickHeight / 2 + labelSpacing  // right of the line
                    : width / 2 - tickHeight / 2 - labelSpacing - 70) // left of the line
                : x(d.date)
            )
            .attr("y", (d, i) => props.vertical
                ? y(d.date)
                : (
                    // horizontal label position
                    i % 2 === 0
                        ? height / 2 - tickHeight / 2 - labelSpacing - 22 // above the line
                        : height / 2 + tickHeight / 2 + labelSpacing + 15 // below the line
                )
            )
            .attr("dy", () => props.vertical ? "-0.26rem" : 0)
            .attr("text-anchor", d => props.vertical ? "start" : "middle") // center the text
            .style("fill", "var(--p-panel-color)")
            .each(function (d) {
                const textElement = select(this);
                textElement.append("tspan")
                    .text(d.type)
                    .attr("x", textElement.attr("x"))

                textElement.append("tspan")
                    .text(d.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
                    .attr("x", textElement.attr("x"))
                    .attr("dy", "1.2rem"); // add vertical spacing between lines
            });

    } else { console.error("[WorkTimeline] SVG ref is not available.") }

})
</script>