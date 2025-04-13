<!-- ~/components/section/DataPortal.vue -->

<template>
    <div style="min-height: 100vh;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        justify-content: center;
        align-items: center;">
        <DataTable :value="input_data" ref="dt" v-model:selection="selectedSessions" removable-sort sortField="date"
            :sortOrder="-1" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]"
            v-model:expandedRows="expandedRows" dataKey="id" v-model:filters="filters" filterDisplay="menu"
            tableStyle="min-width: 80vw;" rowHover
            style="border-radius: 10px; overflow: clip; border: 2px solid var(--p-text-color);" resizableColumns
            scrollable scrollHeight="352px" exportFilename="workday_data" :exportFunction="exportData" editMode="cell"
            @cell-edit-complete="onCellEditComplete">
            <template #header>
                <h3 class="font-bold" style="text-align: center;">
                    Workday Data Portal
                </h3>
            </template>
            <template #empty> No data found. </template>
            <template #loading> Loading data... </template>
            <Column selectionMode="multiple" headerStyle="width: 3rem" :exportable="false" />
            <Column expander style="width: 5rem" :exportable="false">
                <template #header>
                    <Button text
                        :icon="Object.keys(expandedRows).length !== Object.keys(input_data).length ? 'pi pi-plus' : 'pi pi-minus'"
                        label="All" @click="handleExpand" />
                </template>
            </Column>
            <Column sortable field="date" header="Date" dataType="date" :showFilterMatchModes="false" showClearButton>
                <template #body="slotProps">
                    {{ slotProps.data.date
                        && slotProps.data.date.toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                        }) }}
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker inline v-model="filterModel.value" selectionMode="range" dateFormat="mm/dd/yy" />
                </template>
                <template #editor="{ data, field }">
                    <DatePicker v-model="data[field]" dateFormat="mm/dd/yy" />
                </template>
            </Column>
            <Column sortable field="start_time" header="Start" filterField="start_time" dataType='date'
                :showFilterMatchModes="false"> <!-- showClearButton -->
                <template #body="slotProps">
                    {{ slotProps.data.start_time
                        && slotProps.data.start_time.toLocaleString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        }) }}
                </template>
                <template #filter="{ filterModel }">
                    <div style="display: flex; flex-direction: column; gap: 1rem">
                        <FloatLabel variant="on">
                            <DatePicker inputId="start_time_start" v-model="filterModel.value[0]" timeOnly showIcon
                                showButtonBar>
                                <template #dropdownicon>
                                    <i class="pi pi-clock" />
                                </template>
                            </DatePicker>
                            <label for="start_time_start">Start</label>
                        </FloatLabel>
                        <FloatLabel variant="on">
                            <DatePicker inputId="start_time_end" v-model="filterModel.value[1]" timeOnly showIcon
                                showButtonBar>
                                <template #dropdownicon>
                                    <i class="pi pi-clock" />
                                </template>
                            </DatePicker>
                            <label for="start_time_end">End</label>
                        </FloatLabel>
                    </div>
                </template>
                <template #editor="{ data, field }">
                    <DatePicker v-model="data[field]" timeOnly />
                </template>
            </Column>
            <Column sortable field="end_time" header="End" filterField="end_time" dataType="date"
                :showFilterMatchModes="false">
                <!-- showClearButton -->
                <template #body="slotProps">
                    {{ slotProps.data.end_time &&
                        slotProps.data.end_time.toLocaleString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                        }) }}
                </template>
                <template #filter="{ filterModel }">
                    <div style="display: flex; flex-direction: column; gap: 1rem">
                        <FloatLabel variant="on">
                            <DatePicker inputId="end_time_start" v-model="filterModel.value[0]" timeOnly showIcon
                                showButtonBar>
                                <template #dropdownicon>
                                    <i class="pi pi-clock" />
                                </template>
                            </DatePicker>
                            <label for="end_time_start">Start</label>
                        </FloatLabel>
                        <FloatLabel variant="on">
                            <DatePicker inputId="end_time_end" v-model="filterModel.value[1]" timeOnly showIcon
                                showButtonBar>
                                <template #dropdownicon>
                                    <i class="pi pi-clock" />
                                </template>
                            </DatePicker>
                            <label for="end_time_end">End</label>
                        </FloatLabel>
                    </div>
                </template>
                <template #editor="{ data, field }">
                    <DatePicker v-model="data[field]" timeOnly />
                </template>
            </Column>
            <Column sortable field="state" header="Status" :showFilterMatchModes="false" showClearButton>
                <template #body="{ data }">
                    <Tag :value="data.state" :severity="data.state === 'open' ? 'success' : 'danger'" />
                </template>
                <template #filter="{ filterModel }">
                    <Select v-model="filterModel.value" :options="['open', 'closed']" placeholder="Select One"
                        style="width: 100%">
                        <template #option="slotProps">
                            <Tag :value="slotProps.option"
                                :severity="slotProps.option === 'open' ? 'success' : 'danger'" />
                        </template>
                    </Select>
                </template>
                <template #editor="{ data, field }">
                    <Select v-model="data[field]" :options="['open', 'closed']" placeholder="Select One"
                        style="width: 100%" size="small">
                        <template #option="slotProps">
                            <Tag :value="slotProps.option"
                                :severity="slotProps.option === 'open' ? 'success' : 'danger'" />
                        </template>
                    </Select>
                </template>
            </Column>
            <Column :exportable="false" headerStyle="width: 3rem">
                <template #body="slotProps">
                    <Button icon="pi pi-trash" text rounded severity="danger" @click="deleteRow(slotProps.data.id)"
                        size="small" />
                </template>
            </Column>
            <template #expansion="slotProps">
                <DataTable :value="slotProps.data.segments" dataKey="id" style="margin-left: 8rem;" size="small">
                    <Column field="activity" header="Activity"></Column>
                    <Column field="start" header="Start">
                        <template #body="slotProps">
                            {{ slotProps.data.start &&
                                slotProps.data.start.toLocaleString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                }) }}
                        </template>
                    </Column>
                    <Column field="end" header="End">
                        <template #body="slotProps">
                            {{ slotProps.data.end &&
                                slotProps.data.end.toLocaleString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false,
                                }) }}
                        </template>
                    </Column>
                </DataTable>
            </template>
            <template #footer>
                <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center;">
                    <div>{{ input_data ? input_data.length : '0' }} work sessions</div>
                    <div style="display: flex; gap: 1rem">
                        <Button label="Delete" icon="pi pi-trash" severity="danger" outlined @click="deleteSelected"
                            :disabled="!selectedSessions || !selectedSessions.length" size="small" />
                        <Button type="button" icon="pi pi-filter-slash" label="Clear" outlined @click="clearFilter()"
                            size="small" />
                        <Button icon="pi pi-external-link" label="Export" @click="exportCSV()" size="small" />
                    </div>

                </div>
            </template>
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { FilterMatchMode } from '@primevue/core/api';

interface tableData {
    id: number;
    date: Date;
    start_time: Date; // normalize to today's date
    end_time: Date | null; // normalize to today's date
    state: 'open' | 'closed';
    segments: {
        id: number;
        activity: 'working' | 'onBreak';
        start: Date;
        end: Date | null;
    }[]
}

const sessions = [
    {
        "id": 1,
        "start": new Date(1742607452 * 1000),
        "end": new Date(1742607467 * 1000),
        "state": "closed",
        segments: [{
            "id": 1,
            "start": new Date(1742607452 * 1000),
            "end": new Date(1742607467 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 2,
        "start": new Date(1742607477 * 1000),
        "end": new Date(1742609125 * 1000),
        "state": "closed",
        segments: [{
            "id": 2,
            "start": new Date(1742607477 * 1000),
            "end": new Date(1742609125 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 3,
        "start": new Date(1742609380 * 1000),
        "end": new Date(1742617623 * 1000),
        "state": "closed",
        segments: [{
            "id": 3,
            "start": new Date(1742609380 * 1000),
            "end": new Date(1742617623 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 4,
        "start": new Date(1742617670 * 1000),
        "end": new Date(1742618243 * 1000),
        "state": "closed",
        segments: [{
            "id": 4,
            "start": new Date(1742617670 * 1000),
            "end": new Date(1742618243 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 5,
        "start": new Date(1742618248 * 1000),
        "end": new Date(1742618355 * 1000),
        "state": "closed",
        segments: [{
            "id": 5,
            "start": new Date(1742618248 * 1000),
            "end": new Date(1742618355 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 6,
        "start": new Date(1742618359 * 1000),
        "end": new Date(1742618453 * 1000),
        "state": "closed",
        segments: [{
            "id": 6,
            "start": new Date(1742618359 * 1000),
            "end": new Date(1742618453 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 7,
        "start": new Date(1742618455 * 1000),
        "end": new Date(1742618791 * 1000),
        "state": "closed",
        segments: [{
            "id": 7,
            "start": new Date(1742618455 * 1000),
            "end": new Date(1742618791 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 8,
        "start": new Date(1742618794 * 1000),
        "end": new Date(1744475014 * 1000),
        "state": "closed",
        segments: [{
            "id": 8,
            "start": new Date(1742618794 * 1000),
            "end": new Date(1744475014 * 1000),
            "activity": "working"

        }]
    },
    {
        "id": 9,
        "start": new Date(1744475016 * 1000),
        "end": null,
        "state": "open",
        segments: [{
            "id": 9,
            "session_id": 9,
            "start": new Date(1744475016 * 1000),
            "end": null,
            "activity": "working"

        }]
    }
]

const dt = ref();
const exportCSV = () => {
    dt.value.exportCSV();
};

// biome-ignore lint/suspicious/noExplicitAny: in this case, the type really can be anything
function exportData(data: { data: any; field: string }) {
    if (data.data) {
        switch (data.field) {
            case "date": {
                return data.data.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                });
            }
            case "start_time": {
                return data.data.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            }
            case "end_time": {
                return data.data.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            }
            default: {
                return data.data
            }
        }
    }
    return data.data;
}

const today = new Date();
// use the UTC date because the DatePicker seems to be working in UTC
const currentYear = today.getUTCFullYear();
const currentMonth = today.getUTCMonth();
const currentDay = today.getUTCDate();
const input_data = ref<tableData[]>(sessions.map((session) => {

    const returnObject = {
        id: session.id,
        date: session.start,
        // normalize the date part of these objects to UTC today so the time filter works correctly
        start_time: new Date(currentYear, currentMonth, currentDay, session.start.getHours(), session.start.getMinutes(), session.start.getSeconds(), session.start.getMilliseconds()),
        end_time: session.end ? new Date(currentYear, currentMonth, currentDay, session.end.getHours(), session.end.getMinutes(), session.end.getSeconds(), session.end.getMilliseconds()) : null,
        state: session.state as "closed" | "open",
        segments: session.segments.map((segment) => {
            return {
                id: segment.id,
                activity: segment.activity as 'working' | 'onBreak',
                start: segment.start,
                end: segment.end
            }
        })
    }
    return returnObject
}))

const selectedSessions = ref();
const expandedRows = ref({});
const handleExpand = () => {
    if (Object.keys(expandedRows.value).length !== Object.keys(input_data.value).length) {
        expandedRows.value = input_data.value.reduce((acc: Record<number, boolean>, p) => {
            acc[p.id] = true;
            return acc;
        }, {});
    } else {
        expandedRows.value = {};
    }
};

const filters = ref();

const initFilters = () => {
    filters.value = {
        date: { value: null, matchMode: FilterMatchMode.BETWEEN },
        start_time: { value: [null, null], matchMode: FilterMatchMode.BETWEEN },
        end_time: { value: [null, null], matchMode: FilterMatchMode.BETWEEN },
        state: { value: null, matchMode: FilterMatchMode.EQUALS },
    };
};

initFilters();

const clearFilter = () => {
    initFilters();
};

const deleteSelected = () => {
    input_data.value = input_data.value.filter(val => !selectedSessions.value.includes(val));
    selectedSessions.value = null;
};
const deleteRow = (id: number) => {
    input_data.value = input_data.value.filter(val => val.id !== id);
};

// biome-ignore lint/suspicious/noExplicitAny: in this case, the type really can be anything
const onCellEditComplete = (event: any) => {
    let { data, newValue, field } = event;
    console.log(event)

    switch (field) {
        case 'date': {
            data[field] = newValue;
            break;
        }
        case 'start_time': {
            const newTime = new Date(newValue);
            const existingDate = data[field];

            // keep the existing date component of the object (and the seconds)
            const updatedTime = new Date(
                existingDate.getFullYear(),
                existingDate.getMonth(),
                existingDate.getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                existingDate.getSeconds()
            );
            data[field] = updatedTime;
            // TODO: also update the first segment in this data's segments array
            break;
        }
        case 'end_time': {
            const newTime = new Date(newValue);
            const existingDate = data[field];

            // keep the existing date component of the object (and the seconds)
            const updatedTime = new Date(
                existingDate.getFullYear(),
                existingDate.getMonth(),
                existingDate.getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                existingDate.getSeconds()
            );
            data[field] = updatedTime;
            // TODO: also update the first segment in this data's segments array
            break;
        }
        case 'state': {
            data[field] = newValue;
            // TODO: if changing to closed, set the end_time of the session and last segment to the current time, else set them to null
            break;
        }
        default: {
            console.warn(`[onCellEditComplete] field ${field} is not handled`)
            break;
        }
    }
    console.log(`[onCellEditComplete] changed ${field} from ${data[field]} to ${newValue}`)
};
</script>

<style>
:root {
    --p-datatable-header-cell-background: var(--p-datatable-row-striped-background);
    --p-paginator-background: var(--p-datatable-row-striped-background);
    .p-datatable-row-expansion {
        background: var(--p-datatable-row-striped-background);
    }
  }
</style>