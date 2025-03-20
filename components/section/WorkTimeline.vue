<!-- ~/components/section/WorkTimeline.vue -->

<template>
    <div style="width: min-content;" v-if="workday">
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

const { workday } = useWorkday();

console.log('[WorkTimeline] got workday: ', workday.value)

const timelineSvg = ref<SVGSVGElement | null>(null);

// constant value for a straight line
const yValue: number = 0;

// points to render on timeline

// @ts-expect-error component is not rendered when workday is null
const startTime = computed(() => workday.value.start_time);

// Reactive 'now' variable for current time updates
const now = ref(new Date());

// if the workday is open, the currentTime is now, else it's the endtime of the previous workday
const currentTime = computed(() => workday.value?.end_time ?? now.value);

// convert all the breaktime activities into Pause/Unpause points
const breakTimes = computed(() => {
    const breaks: { date: Date, type: PointType }[] = [];
    if (workday.value?.segments) {
        for (const segment of workday.value.segments) {
            if (segment.activity === ActivityType.OnBreak) {
                if (segment.start_time) {
                    breaks.push({ date: segment.start_time, type: PointType.Pause });
                }
                if (segment.end_time) {
                    breaks.push({ date: segment.end_time, type: PointType.Unpause });
                }
            }
        };
    }
    return breaks;
})

// calculate total break time to estimate workday's end time
const totalBreakDuration = computed(() => {
    let duration = 0;
    if (workday.value?.segments) {
        for (const segment of workday.value.segments) {
            if (segment.activity === ActivityType.OnBreak && segment.start_time) {
                duration += (segment.end_time ? segment.end_time : currentTime.value).getTime() - segment.start_time.getTime();
            }
        }
    }
    return duration;
});

const estimatedEndTime = computed(() => {
    if (!startTime.value) return null;
    // calculate initial estimated end time (8 hours from startTime)
    const initialEstimatedEndTime = new Date(startTime.value.getTime() + 8 * 60 * 60 * 1000);
    // subtract total break duration from the initial estimate to get true end time corrected for breaks
    return new Date(initialEstimatedEndTime.getTime() + totalBreakDuration.value);
});

// padding points to add additional line segments beyond start and end points
const startPadding = computed(() => startTime.value ? new Date(startTime.value.getTime() - 30 * 60 * 1000) : null);
const endPadding = computed(() => estimatedEndTime.value && currentTime.value ? new Date(Math.max(estimatedEndTime.value.getTime(), currentTime.value.getTime()) + 30 * 60 * 1000) : null);


const timelineData = computed(() => {
    if (!startTime.value || !estimatedEndTime.value || !currentTime.value || !startPadding.value || !endPadding.value) {
        return [];
    }
    return [
        { date: startPadding.value, type: PointType.Padding },
        { date: startTime.value, type: PointType.Begin },
        ...breakTimes.value,
        { date: currentTime.value, type: PointType.Current },
        { date: estimatedEndTime.value, type: PointType.EstimatedEnd },
        { date: endPadding.value, type: PointType.Padding },
    ];
});

let intervalId: NodeJS.Timeout | null = null;

onMounted(async () => {
    console.log('[WorkTimeline] ============================')
    drawTimeline();

    // Start updating 'now' every minute
    intervalId = setInterval(() => {
        now.value = new Date();
    }, 60 * 1000);

    // watch for changes in workday and redraw the timeline
    watch(workday, () => {
        nextTick(() => {
            // wait to redraw timeline until after svg has been rendered
            console.log('[WorkTimeline] redrawing timeline after workday update');
            drawTimeline()
        })
    });
    
    // watch for changes in currentTime and redraw the timeline
    watch([currentTime, totalBreakDuration], () => {
        nextTick(() => {
          drawTimeline();
        })
    });
})

// clear the interval when the component unmounts to avoid memory leaks
onUnmounted(() => {
    if (intervalId !== null) {
        clearInterval(intervalId);
    }
})

async function drawTimeline() {
    if (timelineSvg.value) {
        // clear the SVG of previous drawings before drawing a new one
        select(timelineSvg.value).selectAll("*").remove();

        // instantiate the d3 chart
        const width = props.vertical === false ? 800 : 200;
        const height = props.vertical === false ? 100 : window.outerHeight;
        const svg = select(timelineSvg.value)
            .attr("width", width)
            .attr("height", height);

        // scale the time in minutes to the dimensions of the chart container
        const minimumValue = min(timelineData.value, d => d.date)
        const maximumValue = max(timelineData.value, d => d.date)

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
        const chartline = line<typeof timelineData.value[number]>()
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
        const drawSegment = (data: typeof timelineData.value, startIndex: number, endIndex: number, color: string) => {
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
        const beginWorkIndex = timelineData.value.findIndex(d => d.type === PointType.Begin);
        drawSegment(timelineData.value, 0, beginWorkIndex, "var(--p-panel-color)");

        // draw the workday segment to the closer value of expected or current index
        const currentIndex = timelineData.value.findIndex(d => d.type === PointType.Current);
        const expectedIndex = timelineData.value.findIndex(d => d.type === PointType.EstimatedEnd);
        drawSegment(timelineData.value, beginWorkIndex, timelineData.value[expectedIndex].date.getTime() < timelineData.value[currentIndex].date.getTime() ? expectedIndex : currentIndex, "var(--workday-active)");


        // draw the overtime segment starting from the expected end to the current index
        if (timelineData.value[currentIndex].date > timelineData.value[expectedIndex].date) {
            drawSegment(timelineData.value, expectedIndex, currentIndex, "var(--workday-closed)");
        }

        // draw the end padding segment
        drawSegment(timelineData.value, currentIndex, timelineData.value.length - 1, "var(--p-panel-color)");

        // draw any paused segments
        for (let i = 0; i < timelineData.value.length; i++) {
            if (timelineData.value[i].type === PointType.Pause) {
                // find the next larger point.date value
                let nextPointIndex = -1;
                for (let j = i + 1; j < timelineData.value.length; j++) {
                    if (timelineData.value[j].type === PointType.Unpause) {
                        nextPointIndex = j;
                        break;
                    }
                }
                // use it to draw a yellow segment
                if (nextPointIndex === -1) {
                    // draw up to the currentIndex if there is no next unpause
                    drawSegment(timelineData.value, i, currentIndex, "var(--workday-paused)");
                } else {
                    drawSegment(timelineData.value, i, nextPointIndex, "var(--workday-paused)");
                }
            }
        }

        // add tick marks for each data point
        const tickHeight = 20;

        svg.selectAll("line.tick") // use a class to easily select the ticks
            .data(timelineData.value.filter(d => d.type !== 'padding'
                && d.type !== PointType.Pause 
                && d.type !== PointType.Unpause)) // minus the padding data points
            .join("line")
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
            .data(timelineData.value.filter(d =>
                d.type !== PointType.Padding
                && d.type !== PointType.Pause 
                && d.type !== PointType.Unpause
            )) // minus the padding, pause and unpause data points
            .join("text")
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
                textElement.selectAll("tspan").remove(); // clear existing tspans
                textElement.append("tspan")
                    .text(d.type)
                    .attr("x", textElement.attr("x"))

                textElement.append("tspan")
                    .text(d.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
                    .attr("x", textElement.attr("x"))
                    .attr("dy", "1.2rem"); // add vertical spacing between lines
            });

    } else { console.error("[WorkTimeline] SVG ref is not available.") }
}
</script>