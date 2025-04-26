<!-- ~/components/section/DataPortal.vue -->

<template>
    <div style="min-height: 100vh;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        justify-content: center;
        align-items: center;">
        <DataTable :value="input_data" ref="dt" v-model:selection="selectedSessions" removable-sort :loading="loading"
            :sortField="sortField" :sortOrder="sortOrder" paginator :rows="rows" :rowsPerPageOptions="[5, 10, 20, 50]"
            v-model:expandedRows="expandedRows" dataKey="id" v-model:filters="filters" filterDisplay="menu"
            tableStyle="" :totalRecords="sessionTotal" rowHover
            style="border-radius: 10px; overflow: clip; border: 2px solid var(--p-text-color);"
            class="min-w-[80vw] max-w-[90vw] min-h-[78vh] max-h-[78vh]" resizableColumns scrollable scrollHeight="flex"
            @page="onPage" @sort="onSort" exportFilename="workday_data" :exportFunction="exportData" editMode="cell"
            @cell-edit-complete="onCellEditComplete" lazy>
            <template #header>
                <h3 class="font-bold" style="text-align: center;">
                    Workday Data Portal
                </h3>
            </template>
            <template #empty>
                <div
                    style="display: flex; flex-direction:column; gap: 1rem; justify-content: center; align-items: center; margin-top: 8rem; margin-bottom: 8rem;">
                    <i class="pi pi-file-excel" style="font-size: 3rem;" />
                    <p>No results. Try adjusting your filters.</p>
                </div>
            </template>
            <template #loading>
                <div style="display: flex; justify-content: center; align-items: center; ">
                    <ProgressSpinner />
                </div>
            </template>
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
                    <div style="cursor: pointer; width: fit-content">
                        {{ slotProps.data.date
                            && slotProps.data.date.toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            })
                        }}
                    </div>
                </template>
                <template #filter="{ filterModel }">
                    <DatePicker inline v-model="filterModel.value" selectionMode="range" dateFormat="mm/dd/yy" />
                </template>
                <template #editor="{ data, field }">
                    <DatePicker v-model="data[field]" dateFormat="mm/dd/yy" size="small" />
                </template>
            </Column>
            <Column sortable field="start_time" header="Start" filterField="start_time" dataType='date'
                :showFilterMatchModes="false"> <!-- showClearButton -->
                <template #body="slotProps">
                    <div style="cursor: pointer; width: fit-content">
                        {{ slotProps.data.start_time
                            && slotProps.data.start_time.toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            })
                        }}
                    </div>
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
                    <DatePicker v-model="data[field]" timeOnly size="small" />
                </template>
            </Column>
            <Column sortable field="end_time" header="End" filterField="end_time" dataType="date"
                :showFilterMatchModes="false">
                <!-- showClearButton -->
                <template #body="slotProps">
                    <div style="cursor: pointer; width: fit-content">
                        {{ slotProps.data.end_time &&
                            slotProps.data.end_time.toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            })
                        }}
                    </div>
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
                    <DatePicker v-model="data[field]" timeOnly size="small" />
                </template>
            </Column>
            <Column sortable field="state" header="Status" :showFilterMatchModes="false" showClearButton>
                <template #body="{ data }">
                    <Tag :value="data.state" :severity="data.state === 'open' ? 'success' : 'danger'"
                        style="cursor: pointer;" />
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
                <div style="display: flex; gap: 1rem; justify-content: space-between; align-items: center;"
                    class="flex-col sm:flex-row">
                    <div>{{ sessionTotal ? sessionTotal : '0' }} work sessions</div>
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
import { H3Error } from 'h3';
import type { workDataApiResponse } from '../../server/api/workData';
import type { DataTableFilterMetaData, DataTablePageEvent, DataTableSortEvent } from 'primevue/datatable';
import { type DataTableFilterMeta, ToastEventBus } from 'primevue';

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

const toast = useToast();

// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*
// *~*~*~*~* FETCHING & SETUP *~*~*~*~*
// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*

const input_data = ref<tableData[]>([])

const router = useRouter();
const route = useRoute();

const rows = ref(Number(route.query.amount) || 10);
const sortOrder = ref(route.query.order === 'desc' ? 1 : -1);
const sortField = ref(route.query.sortby === 'date' ? 'start' : route.query.sortby as string)
const loading = ref<boolean>(true);

const sessionTotal = ref<number>(0);

const fetchSessions = async () => {
    if (import.meta.server) return;

    let loadingTimeout: NodeJS.Timeout | null = null;

    // Set a timeout to set loading to true after 300ms
    const startLoading = () => {
        loadingTimeout = setTimeout(() => {
            loading.value = true;
        }, 300);
    };

    // Clear the timeout if the fetch completes quickly
    const clearLoadingTimeout = () => {
        if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
        }
    };

    startLoading(); // Start the loading timer

    // add the query params to fetch enough data for one configured page in the datatable
    const queryParams = new URLSearchParams();
    queryParams.append('sortby', route.query.sortby as string ?? 'start')
    queryParams.append('order', route.query.order as string ?? 'desc')
    queryParams.append('amount', route.query.amount as string ?? '10')
    queryParams.append('page', route.query.page as string ?? '1')
    queryParams.append('timezoneOffset', String(new Date().getTimezoneOffset()))
    if (route.query.filterBy) {
        queryParams.append('filterBy', route.query.filterBy as string);
    }
    if (route.query.filterValues) {
        queryParams.append('filterValues', route.query.filterValues as string);
    }

    try {
        // do the fetch
        const sessions = await $fetch<workDataApiResponse | null | H3Error>(
            `/api/workData?${queryParams.toString()}`
        );

        // check the fetch response for errors
        if (sessions instanceof H3Error) {
            console.error(
                '[DataPortal] error while fetching work data from server: ',
                sessions
            );
            // Use toast for user feedback
            toast.add({
                severity: 'error',
                summary: 'Error fetching data',
                detail: sessions.message,
                life: 5000
            });
            throw new Error(sessions.message);
        }

        // destructure sessions
        const [sessionData, totalSessions] = sessions ?? [null, null]
        sessionTotal.value = totalSessions ?? 0

        const today = new Date();
        // use the UTC date because the DatePicker seems to be working in UTC
        const currentYear = today.getUTCFullYear();
        const currentMonth = today.getUTCMonth();
        const currentDay = today.getUTCDate();

        // put the fetch results into the input_data ref for the datatable
        input_data.value = sessionData ? sessionData.map((session) => {

            // dates come in as strings, so turn them back into Date objects
            const startAsDate = new Date(session.start)
            const endAsDate = session.end ? new Date(session.end) : null

            const returnObject = {
                id: session.id,
                date: startAsDate,
                // normalize the date part of these objects to UTC today so the time filter works correctly
                start_time: new Date(currentYear, currentMonth, currentDay, startAsDate.getHours(), startAsDate.getMinutes(), startAsDate.getSeconds(), startAsDate.getMilliseconds()),
                end_time: endAsDate ? new Date(currentYear, currentMonth, currentDay, endAsDate.getHours(), endAsDate.getMinutes(), endAsDate.getSeconds(), endAsDate.getMilliseconds()) : null,
                state: session.state as "closed" | "open",
                segments: session.segments.map((segment) => {
                    return {
                        id: segment.id,
                        activity: segment.activity as 'working' | 'onBreak',
                        start: new Date(segment.start),
                        end: segment.end ? new Date(segment.end) : null
                    }
                })
            }
            return returnObject
        }) : []
    } catch (error) {
        console.error('[fetchSessions] An error occurred:', error);
        toast.add({
            severity: 'error',
            summary: 'Data fetch failed',
            detail: error instanceof Error ? error.message : 'An unknown error occurred',
            life: 5000
        });
        clearLoadingTimeout(); // Ensure timeout is cleared even on error
        loading.value = false; // Ensure loading is set to false on error
        // Optionally handle the error in the UI
    } finally {
        // Ensure loading is set to false if the timeout didn't trigger
        if (loadingTimeout) {
            clearTimeout(loadingTimeout);
        }
        loading.value = false;
    }
}

// perform initial data fetch on component render
onMounted(async () => {
    await fetchSessions();
});

// Watch for changes in the route's query parameters
watch(
    () => route.query,
    async () => {
        rows.value = Number(route.query.amount) || 10;
        sortOrder.value = route.query.order === 'desc' ? 1 : -1;
        await fetchSessions(); // Refetch data when query params change
    }
);

// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*
// *~*~*~*~*~*~* EXPORTING *~*~*~*~*~*~*
// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*

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

const selectedSessions = ref<tableData[]>([]);

// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*
// *~*~*~*~*~* ROW EXPANSION *~*~*~*~*~*
// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*

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

// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*
// *~*~*~*~*~*~* FILTERING *~*~*~*~*~*~*
// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*

const filters = ref<DataTableFilterMeta>();

const initFilters = () => {
    const filterBy = route.query.filterBy;
    let filterValues = route.query.filterValues;

    // Check if filterValues is a string and looks like an array
    if (typeof filterValues === 'string' && filterValues.startsWith('[') && filterValues.endsWith(']')) {
        try {
            // Attempt to parse the string as a JSON array
            filterValues = JSON.parse(filterValues);
            console.log('[initFilters] Parsed filterValues', filterValues, typeof filterValues);
        } catch (e) {
            console.error('[initFilters] Failed to parse filterValues string:', e);
            filterValues = null;
        }
    }

    console.log('[initFilters] filterBy', filterBy)
    console.log('[initFilters] filterValues', filterValues, typeof filterValues)
    filters.value = {
        date: { value: filterBy === 'start' ? filterValues : null, matchMode: FilterMatchMode.BETWEEN },
        start_time: {
            value: filterBy === 'start_time' ? Array.isArray(filterValues) ? filterValues.map((value) => {
                return value ? new Date(value) : null
            }) : filterValues : [null, null], matchMode: FilterMatchMode.BETWEEN
        },
        end_time: {
            value: filterBy === 'end_time' ? Array.isArray(filterValues) ? filterValues.map((value) => {
                return value ? new Date(value) : null
            }) : filterValues : [null, null], matchMode: FilterMatchMode.BETWEEN
        },
        state: { value: filterBy === 'state' ? filterValues : null, matchMode: FilterMatchMode.EQUALS },
    };
};

initFilters();

const clearFilter = () => {
    router.push({
        query: {
            ...route.query,
            filterBy: undefined,
            filterValues: undefined
        },
    });
    initFilters();
};

// Watch the filters ref for changes and update the route
watch(filters, async (newFilters, oldFilters) => {
    console.log('[DataPortal] filters changed');
    console.log('    from: ', oldFilters)
    console.log('      to: ', newFilters)

    let filterBy: string | undefined;
    let filterValues: string | undefined;

    // Iterate through filter keys to find the active filter
    // Prioritize in a specific order if needed, here just taking the first active one
    if (!filters.value) throw new Error('[DataPortal] could not filter because filters.value is not defined')
    const filterKeys = Object.keys(filters.value) //as (keyof typeof filters.value)[]; // Get keys with correct type hint

    console.log('[DataPortal] filter keys are: ', filterKeys)

    for (const key of filterKeys) {
        const filterState = filters.value[key] as DataTableFilterMetaData;
        const filterValue = filterState.value;
        console.log('[DataPortal] filter state: ', filterState)

        // Check if the filter has an active value
        const isActive = Array.isArray(filterValue)
            ? filterValue.some(val => val !== null) // For tuples, check if at least one element is not null
            : filterValue !== null && filterValue !== undefined && filterValue !== ''; // For other types, check for non-empty value


        console.log(`[DataPortal] ${key} has ${!isActive && 'no'} active filters`)
        if (isActive) {
            // Map frontend filter keys to backend filterBy keys
            const frontendToBackendFilterMap: Record<string, string> = {
                'date': 'start', // Frontend 'date' field corresponds to backend 'start' timestamp for date range filter
                'start_time': 'start_time',
                'end_time': 'end_time',
                'state': 'state',
                // Add other mappings if necessary
            };

            // Map the frontend key to the backend filterBy name
            const backendFilterKey = frontendToBackendFilterMap[key];
            console.log(`[DataPortal] converted ${key} to ${backendFilterKey} for the back-end filters`)
            if (backendFilterKey) {
                filterBy = backendFilterKey;

                // Serialize the filter value for the URL
                if (backendFilterKey === 'state') {
                    // State filter value is already a string ('open' | 'closed')
                    filterValues = String(filterValue);
                } else {
                    // Date/Time filter value is a [Date | null, Date | null] tuple
                    // Convert Date objects to ISO strings or timestamps for serialization
                    // It's better to send ISO strings as they retain more info than unix timestamps,
                    // and Zod can coerce them back to Dates.
                    const serializableTuple = Array.isArray(filterValue) ? filterValue.map(date => date instanceof Date ? date.toISOString() : null) : filterValue;
                    console.log('[DataPortal] got serializableTuple', serializableTuple)
                    try {
                        filterValues = JSON.stringify(serializableTuple);
                        console.log('[DataPortal] serialized to ', filterValues)
                    } catch (e) {
                        console.error(`[DataPortal] Failed to serialize filter value for ${key}:`, filterValue, e);
                        // If serialization fails, don't apply this filter
                        filterBy = undefined;
                        filterValues = undefined;
                        break; // Stop processing filters
                    }
                }
                break; // Found an active filter, apply it and stop
            }
        }
    }

    console.log(`[DataTable] adding ${filterBy} and ${filterValues} to query params`)

    await router.push({
        query: {
            ...route.query,
            filterBy: filterBy,
            filterValues: filterValues
        },
    });

}, { deep: true });

// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*
// *~*~*~*~*~*~* DELETING *~*~*~*~*~*~*
// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*

const deleteSelected = async () => {
    const response = await $fetch<workDataApiResponse | null | H3Error>('/api/workData', {
        method: 'DELETE',
        body: {
            ids: selectedSessions.value?.map((session) => { return session.id })
        }
    })

    if (response instanceof H3Error) {
        console.error(
            `[DataPortal/deleteSelected] error while deleting sessions ${selectedSessions.value?.map((session) => { return `${session.id}, ` })}: `,
            response
        );
        throw new Error(response.message);
    }

    if (!response) {
        input_data.value = input_data.value.filter(val => !selectedSessions.value?.includes(val));
        selectedSessions.value = [];
    } else {
        throw new Error(`[DataPortal/deleteSelected] unexpected state encountered while deleting sessions ${selectedSessions.value.map((session) => { return `${session.id}, ` })}: `)
    }
};

const deleteRow = async (id: number) => {
    const response = await $fetch<workDataApiResponse | null | H3Error>('/api/workData', {
        method: 'DELETE',
        body: {
            ids: [id],
        }
    })

    if (response instanceof H3Error) {
        console.error(
            `[DataPortal/deleteSelected] error while deleting session ${id}: `,
            response
        );

        ToastEventBus.emit('add', {
            severity: 'error',
            summary: `Encountered error while deleting session ${id}: ${response.message}.`,
            detail: `${response.statusCode}: ${response.statusMessage}\ncause: ${response.cause}\nname: ${response.name}`,
            life: 4000,
        });
        throw new Error(response.message);
    }
    if (!response) {
        input_data.value = input_data.value.filter(val => val.id !== id);

        ToastEventBus.emit('add', {
            severity: 'success',
            summary: `Successfully deleted session ${id}.`,
            life: 4000,
        });
    } else {
        ToastEventBus.emit('add', {
            severity: 'error',
            summary: `Encountered unexpected state while deleting session ${id}.`,
            life: 4000,
        });
        throw new Error(`[DataPortal/deleteSelected] unexpected state encountered while deleting session ${id}`)
    }
};

// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*
// *~*~*~*~*~* CELL EDITING *~*~*~*~*~*
// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*

/**
 * github issue for DatePicker closing too soon in cell
 * 
 * https://github.com/primefaces/primevue/issues/7598
 */

// biome-ignore lint/suspicious/noExplicitAny: in this case, the type really can be anything
const onCellEditComplete = async (event: any) => {
    let { data, newValue, field } = event;
    console.log('[DataPortal/onCellEditComplete] data, newValue, field', data, newValue, field)

    let response: workDataApiResponse | null | H3Error = new H3Error('temporary error');
    switch (field) {
        case 'date': {
            console.log(`[DataPortal/onCellEditComplete] ${field} old and new values are ${data[field] === newValue ? 'equal' : 'unequal'}: `, data[field], newValue)
            if (data[field] === newValue) return;
            const newTime = new Date(newValue);

            // get the time out of the old value
            const timeToSubmit = new Date(
                newTime.getFullYear(),
                newTime.getMonth(),
                newTime.getDate(),
                data[field].getHours(),
                data[field].getMinutes(),
                data[field].getSeconds()
            )

            response = await $fetch<workDataApiResponse | null | H3Error>('/api/workData', {
                method: 'POST',
                body: {
                    column: 'start',
                    rowId: data.id,
                    newValue: timeToSubmit.getTime()
                }
            })
            if (!response) {
                // successful
                data[field] = timeToSubmit;
            }
            break;
        }
        case 'start_time': {
            const newTime = new Date(newValue);
            const existingDate = data[field];

            // keep the existing date component of the object (and the seconds) or use today
            const updatedTime = existingDate ? new Date(
                existingDate.getFullYear(),
                existingDate.getMonth(),
                existingDate.getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                existingDate.getSeconds()
            ) : new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                0 // seconds
            );

            console.log(`[DataPortal/onCellEditComplete] ${field} old and new values are ${data[field] === updatedTime ? 'equal' : 'unequal'}: `, data[field], updatedTime)
            if (data[field].getHours() === updatedTime.getHours() && data[field].getMinutes() === updatedTime.getMinutes()) return;

            // generate a date from the time in newValue and the date in data.date
            const submittedDate = new Date(
                data.date.getFullYear(),
                data.date.getMonth(),
                data.date.getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                0
            )

            response = await $fetch<workDataApiResponse | null | H3Error>('/api/workData', {
                method: 'POST',
                body: {
                    column: 'start',
                    rowId: data.id,
                    newValue: submittedDate.getTime()
                }
            })
            if (!response) {
                // successful
                data[field] = updatedTime;
            }
            break;
        }
        case 'end_time': {
            const newTime = new Date(newValue);
            const existingDate = data[field];

            // keep the existing date component of the object (and the seconds)
            const updatedTime = existingDate ? new Date(
                existingDate.getFullYear(),
                existingDate.getMonth(),
                existingDate.getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                existingDate.getSeconds()
            ) : new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                0 // seconds
            );

            console.log(`[DataPortal/onCellEditComplete] ${field} old and new values are ${data[field] === updatedTime ? 'equal' : 'unequal'}: `, data[field], updatedTime)
            if (data[field].getHours() === updatedTime.getHours() && data[field].getMinutes() === updatedTime.getMinutes()) return;

            // generate a date from the time in newValue and the date in data.date
            const submittedDate = new Date(
                data.date.getFullYear(),
                data.date.getMonth(),
                data.date.getDate(),
                newTime.getHours(),
                newTime.getMinutes(),
                0
            )

            response = await $fetch<workDataApiResponse | null | H3Error>('/api/workData', {
                method: 'POST',
                body: {
                    column: 'end',
                    rowId: data.id,
                    newValue: newValue ? submittedDate.getTime() : null
                }
            })
            if (!response) {
                // successful
                data[field] = newValue ? updatedTime : null;
            }
            break;
        }
        case 'state': {
            console.log(`[DataPortal/onCellEditComplete] ${field} old and new values are ${data[field] === newValue ? 'equal' : 'unequal'}: `, data[field], newValue)
            if (data[field] === newValue) return;
            response = await $fetch<workDataApiResponse | null | H3Error>('/api/workData', {
                method: 'POST',
                body: {
                    column: field,
                    rowId: data.id,
                    newValue
                }
            })
            if (!response) {
                // successful
                data[field] = newValue;
            }
            break;
        }
        default: {
            console.warn(`[onCellEditComplete] field ${field} is not handled`)
            break;
        }
    }

    if (response instanceof H3Error) {
        console.error(
            `[DataPortal/deleteSelected] error while changing ${field} from ${data[field]} to ${newValue}: `,
            response
        );

        ToastEventBus.emit('add', {
            severity: 'error',
            summary: `Encountered error while changing ${field} from ${data[field]} to ${newValue}.`,
            detail: `${response.statusCode}: ${response.statusMessage}\n
            cause: ${response.cause}\n
            name: ${response.name}`,
            life: 4000,
        });
        throw new Error(response.message);
    }
    if (!response) {
        ToastEventBus.emit('add', {
            severity: 'success',
            summary: `Successfully updated ${field}`,
            detail: `${newValue}`,
            life: 4000,
        });
        fetchSessions();
    } else {
        ToastEventBus.emit('add', {
            severity: 'error',
            summary: `Encountered unexpected state while changing ${field} from ${data[field]} to ${newValue}.`,
            life: 4000,
        });
        throw new Error(`[DataPortal/deleteSelected] unexpected state encountered while changing ${field} from ${data[field]} to ${newValue}`)
    }
};

// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*
// *~*~*~*~* DATA VIEW UPDATES *~*~*~*~*
// *~*~*~*~*~*~**~*~*~*~*~*~**~*~*~*~*~*

const onPage = (event: DataTablePageEvent) => {
    // Update the route with the new page and amount
    router.push({
        query: {
            ...route.query,
            page: event.page + 1, // PrimeVue's page is 0-based
            amount: event.rows,
        },
    });
    // the amount update is handled by the watch statement
};

const onSort = (event: DataTableSortEvent) => {
    // Update the sorting refs
    sortOrder.value = event.sortOrder ?? 0;
    sortField.value = typeof event.sortField === 'string' ? event.sortField === 'date' ? 'start' : event.sortField : 'start'
    // Update the route with the new sorting params
    router.push({
        query: {
            ...route.query,
            order: event.sortField ? event.sortOrder === 1 ? 'desc' : 'asc' : undefined,
            sortby: typeof event.sortField === 'string' ? event.sortField === 'date' ? 'start' : event.sortField : undefined
        },
    });
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