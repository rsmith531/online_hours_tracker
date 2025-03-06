<!-- ~/components/base/SettingsToast.vue -->

<template>
  <Toast position="top-center" group="settings-toast">
    <template #container="{ message, closeCallback }">
      <div class="
            p-[0.5rem] sm:p-[1rem]" :style="{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }">
        <h1 :style="{ fontWeight: 'bold', textAlign: 'center' }">Settings</h1>
        <Panel header="Notifications" :style="{ width: 'fit-content', alignSelf: 'center' }" :pt="{
          content: {
            style: { display: 'flex', flexDirection: 'row', gap: '1rem', width: 'fit-content' }
          },
          contentContainer: { style: { width: 'fit-content' } }
        }">
          <SelectButton :modelValue="notificationSelectValue" @change="onNotificationOnChange" size="small"
            :options="options" :invalid="notificationSelectValue === null" :style="{
              border: '1px solid var(--p-inputtext-border-color)'
            }" />
          <IftaLabel>
            <InputNumber incrementIcon="pi pi-plus" decrementIcon="pi pi-minus" variant="filled"
              :modelValue="notificationInputValue" inputId="frequency" @update:modelValue="onNotificationIntervalChange"
              size="small" :min="1" :max="60 * 24 - 1" showButtons buttonLayout="stacked" suffix=" minutes"
              :disabled="notificationSelectValue === 'Off'" :pt="{
                input: {
                  class: {
                    style: {
                      width: 'min-content'
                    }
                  }
                }
              }"></InputNumber>
            <label for="frequency">Frequency</label>
          </IftaLabel>
        </Panel>
        <Button :style="{ alignSelf: 'end', width: 'fit-content' }" type="button" label="Done" icon="pi pi-check"
          :loading="doneLoading" @click="handleDoneClick" />
      </div>
    </template>
  </Toast>
</template>

<!-- TODO: add a cool progress bar to the bottom that counts down until the toast will disappear -->
<script setup>
import { ref } from 'vue';
const { $siteSettings } = useNuxtApp();
const siteSettings = $siteSettings;

const options = ref(['Off', 'On']);
const doneLoading = ref(false);

const notificationSelectValue = computed({
  get: () => {
    return siteSettings.reactiveSettings().value.notificationsOn ? 'On' : 'Off';
  },
});

const onNotificationOnChange = (event) => {
  doneLoading.value = true;
  const newValue = event.value;
  if (newValue === 'On') {
    siteSettings.setNotificationsOn(true);
  }
  else if (newValue === 'Off') {
    siteSettings.setNotificationsOn(false);
  }
  else if (!newValue) {
    const lastSetting = siteSettings.reactiveSettings().value.notificationsOn;
    siteSettings.setNotificationsOn(!lastSetting);
  }
  else {
    throw new Error('Something went wrong while trying to set the notificationsOn setting.')
  }
  doneLoading.value = false;
};

const notificationInputValue = computed({
  get: () => {
    return siteSettings.reactiveSettings().value.notificationInterval / 60; // convert seconds to minutes
  }
});

let debounceTimer;
const onNotificationIntervalChange = (newValue) => {
  clearTimeout(debounceTimer);
  doneLoading.value = true;
  debounceTimer = setTimeout(() => {
    siteSettings.setNotificationInterval(newValue * 60); //convert minutes to seconds
    doneLoading.value = false;
  }, 500);
};

const toast = useToast();
const handleDoneClick = () => {
  toast.removeGroup("settings-toast");
};
</script>