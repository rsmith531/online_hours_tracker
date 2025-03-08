# My Workday Tracker

### Motivation

After having spent the past while working in a React/Next stack, I decided I had my feet underneath me enough to try learning how to use Vue & Nuxt. I had heard it described as an up and coming competitor in the space that React and Next dominate. With that in mind, I needed a small project to use as the whetstone upon which I'd sharpen my skills.

Not too long ago, I had decided to create a small WPF app in order to learn how desktop apps can be made, how the Windows notifications API works, and how people make use of the system tray in the taskbar. For this project, I made a simple GUI that allows the user to open, pause, and close a workday. The app shows you how long you've been working and allows you to enable periodic desktop notifications reminding you to take a break.
<div style="display: flex; flex-direction:row; gap: 2rem;" class="flex-wrap">
<img src="2025-03-07 17_52_17-Timesheet Dashboard.png" alt="What the desktop application looked like" title="What the desktop application looked like" width="300px" />

<img src="Screenshot 2025-03-07 175254.png" alt="The system tray popover the user sees when clicking the icon" title="The system tray popover the user sees when clicking the icon" width="300px" height="min-content" class="h-min" /></div>

Like most first attempts, the app wasn't perfect. The time calculations were hacked together. The notifications would sometimes send back-to-back, nonstop until you disabled them in the Windows settings, and it didn't show as much information as I'd have liked to display. These imperfections, combined with the relatively small scope of the project, led me to select it as the basis of my Nuxt project. Because I had implemented a version of the baseline features, it allowed me some spare [innovation tokens](https://mcfunley.com/choose-boring-technology#embrace-boredom) to spend on some new ones:

#### Baseline features

1. A user can open and close workdays.
2. A user can pause their workday (e.g. to go on break).
3. Information about the workday is saved to persistent storage.
4. A user can see information about their current or last workday, depending on if their workday is currently opened or closed.
5. A user can activate and deactivate periodic push notifications about their workday.

#### Enhanced features

1. A workday timeline that shows the user relevant data to aid them in planning their day/week.
2. A secure environment that only the user can access.
3. A slick, well put-together UI.
4. Export workday data as a `.csv` file.

### Technologies used

I needed to make some decisions about what supporting technologies would help me bring this project to life quickly and without abstracting away the details of that which I was trying to learn. 

#### Front-end framework

Of course, this whole thing kicked off because I wanted to learn [Vue](https://vuejs.org/). The `.vue` file syntax felt very alien to me. Given this is where the whole project began, it's probably the weakest part of it all, as I was reading docs and diving into unfamiliar concepts for the first time. I've had to go back and rework several of my components as the concepts slowly cemented themselves in my mind. Syntax and approaches I had used in previous project constantly threw bugs in my face because, it turns out Vue had designed systems like [composables](https://vuejs.org/guide/reusability/composables.html), [plugins](https://vuejs.org/guide/reusability/plugins.html), and [reactivity](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) to handle the tasks and I was short circuiting their capabilities by not using them correctly.

#### Component library

I didn't want to spend weeks putting together components that would ultimately end up being subpar to the ones that big teams full of very experienced developers had already done. I narrowed down my choices to [shadcn-vue](https://www.shadcn-vue.com/), [PrimeVue](https://primevue.org/), and [Quasar](https://quasar.dev/). I don't remember why I didn't choose Quasar, but my first pick was shadcn, because it gave the developer a lot of flexibility to use the components exactly the way they see fit. Unfortunately, it was a little too much flexibility for my use, because I got too bogged down in the details trying to get things looking right. This left PrimeVue. They provided a lot of useful components, and the implementation went smoothly, but I later discovered that PrimeVue v4 introduced some [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) when [used with server-side rendering](https://github.com/primefaces/primevue/issues/5899) (read: when being used with Nuxt). I was in too deep to switch libraries again, so I accepted it for now with the hopes that the team will push out a fix in a future update.

I augmented PrimeVue with [Tailwind](https://tailwindcss.com/) utility classes that make [responsive design](https://tailwindcss.com/docs/responsive-design) a breeze. PrimeVue also provides some plug-n-play [iconography](https://primevue.org/icons/#list) that I found useful.


#### Web development framework

The orchestrator of all the bits and pieces that make up this project is [Nuxt](https://nuxt.com/).

## Roadmap

### v1.0.0

1. All the stuff I already did
2. Fix website themes and styling.

### v1.1.0

1. Fully type the project and correct type errors.
    - API endpoints through `zod`.
    - Harness Nuxt and Vue TypeScript capabilities.
2. Turn off Nuxt auto-imports.
3. Write comprehensive test suites.
4. Create a CI/CD pipeline.
5. Replace the `web-push` library with Javascript built-ins

### v1.2.0

1. Workday Timeline feature.

### v1.3.0

1. Workday data editor.
    - Implemented through the [PrimeVue DataTable component](https://primevue.org/datatable/)

### v1.4.0

1. Workday data dashboard.

### Resources

- [How to use Primevue Toast outside of a component](https://stackoverflow.com/questions/72425297/vue-warn-inject-can-only-be-used-inside-setup-or-functional-components)
- [How to make a push notification service worker](https://javascript.plainenglish.io/push-notifications-using-a-service-worker-5f2e371774e)
- [How to see console logs for service worker](https://discourse.mozilla.org/t/how-to-enable-console-log-from-service-worker/130394/8)
- [HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [How to do basic Nuxt auth](https://nuxt.com/docs/guide/recipes/sessions-and-authentication)
- [Running Caddy on Render](https://kofi.sexy/blog/zero-downtime-render-disk)
- [Deploying to Hetzner](https://turbocloud.dev/book/deploy-nuxt-digital-ocean-hetzner/)
- [Putting a Nuxt3 app on a VPS](https://dev.to/wimadev/deploy-a-nuxt-3-app-on-a-vps-minimal-setup-3h91)
- [Vue plugins vs. composables vs. stores](https://bigmachine.io/frontend/what-should-be-a-plugin-vs-a-composable-vs-a-store-in-nuxt)
- [Good practices and Design Patterns for Vue Composables](https://dev.to/jacobandrewsky/good-practices-and-design-patterns-for-vue-composables-24lk)
