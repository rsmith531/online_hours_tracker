<!-- ~/components/section/AboutModal.vue -->

<template>
  <Button id="modal-button" @click="visible = true" severity="info" icon="pi pi-question" variant="text" rounded style="
    position: absolute; 
    right: 2rem; 
    top: 2rem;" />
  <Dialog v-model:visible="visible" maximizable modal dismissableMask header="About" :style="{ width: '85vw' }">
    <div v-html="htmlContent" autofocus></div>
  </Dialog>

</template>

<script setup>
import showdown from 'showdown';
import { ref } from "vue";
import readmeFile from "~/README.md?raw"

// ref for the modal visibility
const visible = ref(false);

// convert the README.md to html
const converter = new showdown.Converter();
converter.setFlavor('github');
const htmlContent = ref(converter.makeHtml(readmeFile));
</script>