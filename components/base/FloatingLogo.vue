<!-- ~/components/base/FloatingLogo.vue -->

<template>
    <div style="
      position: absolute; 
      left: 2rem; 
      top: 2rem;
      display: flex;
      flex-direction: row; 
      gap:1rem; 
      align-items: center;">
        <NuxtLink to="/" rel="next">
            <NuxtImg src="favicon.png" alt="Workday Tracker Logo" title="Workday Tracker Logo" height="40px" width="40px" preload />
        </NuxtLink>
        <h3 class="hidden sm:block">Workday Tracker</h3>
    </div>
</template>