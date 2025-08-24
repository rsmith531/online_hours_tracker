[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC_BY--NC--SA_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

# My Workday Tracker

Here to demo the website? Reach out to me at [inquiries@roamers.rest](mailto:inquiries@roamers.rest) or on LinkedIn for more information.

</div>

## Motivation

After having spent the past while working in a React/Next stack, I decided I had my feet underneath me enough to try learning how to use Vue & Nuxt. I had heard it described as an up and coming competitor in the space that React and Next dominate. With that in mind, I needed a small project to use as the whetstone upon which I'd sharpen my skills.

Not too long ago, I had decided to create a small WPF app in order to learn how desktop apps can be made, how the Windows notifications API works, and how people make use of the system tray in the taskbar. For this project, I made a simple GUI that allows the user to open, pause, and close a workday. The app shows you how long you've been working and allows you to enable periodic desktop notifications reminding you to take a break.

<div style="display: flex; flex-direction:row; gap: 2rem; padding-bottom: 1rem;" class="flex-wrap">

<img src="2025-03-07 17_52_17-Timesheet Dashboard.png" alt="What the desktop application looked like" title="What the desktop application looked like" width="300px" />

<img src="Screenshot 2025-03-07 175254.png" alt="The system tray popover the user sees when clicking the icon" title="The system tray popover the user sees when clicking the icon" width="300px" height="min-content" class="h-min" />

</div>

Like most first attempts, the app wasn't perfect. The time calculations were hacked together. The notifications would sometimes send back-to-back, nonstop until you disabled them in the Windows settings, and it didn't show as much information as I'd have liked to display. These imperfections, combined with the relatively small scope of the project, led me to select it as the basis of my Nuxt project. Because I had implemented a version of the baseline features, it allowed me some spare [innovation tokens](https://mcfunley.com/choose-boring-technology#embrace-boredom) to spend on some new ones:

### Baseline features

1. A user can open and close workdays.
2. A user can pause their workday (e.g. to go on break).
3. Information about the workday is saved to persistent storage.
4. A user can see information about their current or last workday, depending on if their workday is currently opened or closed.
5. A user can activate and deactivate periodic push notifications about their workday.

### Enhanced features

1. A workday timeline that shows the user relevant data to aid them in planning their day/week.
2. A secure environment that only the user can access.
3. A slick, well put-together UI.
4. Edit, view, and export workday data.
5. Live updates for all clients when the workday status changes.

## Technologies used

I needed to make some decisions about what supporting technologies would help me bring this project to life quickly and without abstracting away the details of that which I was trying to learn. 

### Front-end framework

Of course, this whole thing kicked off because I wanted to learn [**Vue**](https://vuejs.org/). The `.vue` file syntax felt very alien to me. Given this is where the whole project began, it's probably the weakest part of it all, as I was reading docs and diving into unfamiliar concepts for the first time. I've had to go back and rework several of my components as the concepts slowly cemented themselves in my mind. Syntax and approaches I had used in previous project constantly threw bugs in my face because, it turns out Vue had designed systems like [composables](https://vuejs.org/guide/reusability/composables.html), [plugins](https://vuejs.org/guide/reusability/plugins.html), and [reactivity](https://vuejs.org/guide/essentials/reactivity-fundamentals.html) to handle the tasks and I was short circuiting their capabilities by not using them correctly.

### Component library

I didn't want to spend weeks putting together components that would ultimately end up being subpar to the ones that big teams full of very experienced developers had already done. I narrowed down my choices to [shadcn-vue](https://www.shadcn-vue.com/), [**PrimeVue**](https://primevue.org/), and [Quasar](https://quasar.dev/). I don't remember why I didn't choose Quasar, but my first pick was shadcn, because it gave the developer a lot of flexibility to use the components exactly the way they see fit. Unfortunately, it was a little too much flexibility for my use, because I got too bogged down in the details trying to get things looking right. This left PrimeVue. They provided a lot of useful components, and the implementation went smoothly, but I later discovered that PrimeVue v4 introduced some [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) when [used with server-side rendering](https://github.com/primefaces/primevue/issues/5899) (read: when being used with Nuxt). I was in too deep to switch libraries again, so I accepted it for now with the hopes that the team will push out a fix in a future update.

### Styling

PrimeVue ships with the pretty clean-looking Aura theme to hit the ground running and also provides some plug-n-play [iconography](https://primevue.org/icons/#list) that I found useful. I augmented PrimeVue with [**Tailwind**](https://tailwindcss.com/) utility classes that make [responsive design](https://tailwindcss.com/docs/responsive-design) a breeze. Since dark mode is all the rage these days, I built a toggler using [**`@nuxtjs/color-mode`**](https://color-mode.nuxtjs.org/) with a little tweaking to work with [tailwind](https://tailwindcss.com/docs/dark-mode#toggling-dark-mode-manually) and [PrimeVue](https://primevue.org/theming/styled/#darkmode).

Finally, I needed a good font for my digital stopwatch. At first, I used [Doto](https://fonts.google.com/specimen/Doto) because I didn't know much about serving my own font files, and this had styling that most closely matched a 7-segment display I could find at Google Fonts. Once I had a better understanding of using fonts, I landed on Keshikan's [**DSEG font family**](https://www.keshikan.net/fonts-e.html). He also gave me the idea for the blinking colons and numeric background.

### Web development framework

The orchestrator of all the bits and pieces that make up this project is [**Nuxt**](https://nuxt.com/). One of the main selling points of Nuxt is their auto-import feature, which means you'll <sub>almost</sub> never type `import { x } from 'y';` again. I must admit I had a healthy distrust of the capabilities of this feature, and I spent far too much time trying to interfere with it, but when I left it to its own devices, everything just showed up where it should.

Beyond that, they provide some pretty nifty [dev tools](https://devtools.nuxt.com/), [modules](https://nuxt.com/modules), an [opinionated project file structure](https://nuxt.com/docs/guide/directory-structure/), and more [nice-to-haves](https://nuxt.com/docs/getting-started/introduction) that got me up and running pretty quickly. It also uses ["blazingly-fast"](https://tonai.github.io/blog/posts/bundlers-comparison/#performance-comparison) [Vite](https://vite.dev/) for hot module reloading in development and a nice, clean build for deployment. Rounding it out is [Nitro server](https://nitro.build/) to do the serving quick, fast, and in a hurry.

One last note on Nuxt: all of its configuration lives [in one file](https://nuxt.com/docs/api/nuxt-config). When you add in other packages via a Nuxt module, it allows you to configure it in the Nuxt config instead of the package's usual config method. This is useful for keeping it centralized, but I also found that for some tools, such as tailwind, I had more success using the package itself rather than the Nuxt module version of it. I think that it often has to do with the module maintainer's ability to keep up on its dependencies, especially when they are evolving as often as they are. For example, when using [`vue-query-nuxt`](https://nuxt.com/modules/vue-query), I found myself running into some strange errors that I was able to resolve by reverting to using the Vue-Query package itself. Admittedly, this is when I was early into the project, so it is very possible the problem was that I was misusing it as I did not fully understand the workings of Nuxt.

### Data persistence

"Real" databases take a bit of work to stand up and maintain. The small scale of my project meant I got to skip all that and use [**SQLite**](https://www.sqlite.org/whentouse.html), which puts the whole database in a couple little files. The actual implementation of that was made even easier with the excellent [**`better-sqlite3`**](https://github.com/WiseLibs/better-sqlite3) library. Using [**Vue query**](https://tanstack.com/query/v5/docs/framework/vue/overview), all parts of the platform could access and update the data through an API endpoint from a centralized location that also provided some very neat caching and other optimizing abilities.

To make the database a little easier to work with in Typescript, I chose [**Drizzle**](https://orm.drizzle.team/) for my [ORM](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping). I originally started the project without it, so when I integrated it, the code clarity improved drastically and allowed me to type my function signatures to match the types representing the database objects. Now, if the underlying schema changes, I will see how those changes impact the performance of its use across the codebase in the way of type errors.

An interesting implementation detail I had to tackle was how I would persist a user's site settings across sessions. One approach is to save their settings to a table in the database. However, this meant that their settings would be the same across all devices they used to access the platform. I wanted to let the user configure their site settings by device. It gave me a great opportunity to explore the [Window API's **local storage**](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) feature. I used it to store the settings on the browser in a manner that would stick around until the user cleared their cache.

When my data needs grow too complex for SQLite, I'd like to migrate to a [PostgreSQL database](https://www.postgresql.org/), possibly implemented with a self-hosted [Supabase](https://supabase.com/docs/guides/self-hosting) instance.

### Push notifications

Did you know browsers can't run Typescript files? I didn't. Or maybe, I knew subconsciously or indirectly, since I knew that my project is bundled into minified Javascript files before being served to the client. It didn't really hit me until I had to install a [**service worker**](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) on the client to enable push notifications.

I wanted users to have the option to enable periodic notifications that remind them of how long their workday has been open, even when they didn't have the website open in the browser. To send the notification from the server, I accessed the [Web Push Protocol](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-protocol) via the [**`web-push`**](https://www.npmjs.com/package/web-push) library.  To display the notification, the browser gives me the [**Push API**](https://developer.mozilla.org/en-US/docs/Web/API/Push_API). These two technologies made the implementation relatively painless.

The interesting part is the "even when they didn't have the website open in the browser" part. To do this, I had to write code to register (install) a Javascript file (service worker) that would run on the browser in a separate thread to listen to the server for incoming notifications and display them to the user. That file was a bit of a challenge to debug, because its console logs don't go to the normal client console and the worker decides when to run once it is registered. Firefox has [additional dev tools](about:debugging#/runtime/this-firefox) that show the registered workers, and you can use that to open a console specific to a service worker, but only when it is running.

### Live updates

<img src="websockets.jpg" alt="A not-very-funny meme I made about websockets" title="Websockets aliens meme" width="300px" height="min-content" class="h-min" />

A feature that was not initially on my roadmap, but snuck its way onto it when I realized it was possible, was refreshing the workday data across all clients when one client updates it. What I observed was that I could go to the website on my phone and my desktop at the same time, stop or start the workday on my phone, and the desktop would appear as if nothing had changed.

Enter: [websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).

Traditionally, the only time the server talks to a client is when the client sends a request. A websocket is basically a two-way persisting connection between a client and a server. This means the server can initiate a request to give the client some new information. The technology apparently has some caveats and implementation details that are all nicely abstracted away by [**socket.io**](https://socket.io/). I applied this capability to advise all of the server's websocket-connected clients that it has new information for them.

### Timeline

When I first dreamt up the idea of showing a live summary of the workday, I had a few design requirements in my head: 

- Represent the active and paused segments of the workday.
- Represent when the user is working past the estimated 8 hour workday.
- Label the start, current, and estimated end points on the line.

Trying to stick with my existing libraries, I looked at Primevue's [Timeline](https://primevue.org/timeline/) first, but the points were evenly spaced, and you could not change the spacing to show relative differences in segment lengths. Then I thought, "What if I used a line chart with points whose *y*-value is constant?" That would get me a straight line with varying spacing between the points. I would just need to find a way to show the line without showing the chart. Research led me to [Chart.js](https://www.chartjs.org/docs/latest/charts/line.html), but it seemed like too much of the implementation was abstracted away for me to extract the line from the line chart. It's a very "batteries included" package where the customization is limited to the methods provided by the package.

I landed on [**D3.js**](https://d3js.org/d3-shape/line). There's [a lot of mixed emotions](https://www.reddit.com/r/d3js/comments/1230xcm/d3_is_going_to_be_made_irrelevant_by_its/) about this older package, but it felt like a box of Legos you could use to piece together some really unique builds. The library was designed during a time before front-end frameworks really embraced reactivity and virtual DOMs, so it took a little haranguing to get it working right in Vue. I'm not convinced my implementation is the most efficient or cleanest, but it sure does look nifty and perfectly achieves the design requirements I set out with.

### Data Editor

Man, oh man. I was pretty confident this would be a challenging thing to implement. Even still it was harder than I anticipated. My basic idea was to use [**PrimeVue's DataTable component**](https://primevue.org/datatable/) to display an interactive table where the user could filter, sort, edit, and delete data about their workday history. I started with some sample data loaded into memory and did these operations solely on the front-end just to get the component in place without worrying about the complexities of the back-end logic. Then, I hooked up the features to a back-end API endpoint one by one: fetching the live data, editing cells, pagination and sorting, deleting rows, and finally filtering.

I'm not convinced this was the best way to go about this implementation. I think I ended up with cluttered, inefficient and disorganized code. This is because the DataTable component's front-end implementation of table operations is very powerful and someone spent a lot of time thinking about how to make it great. However, converting it to back-end table operations was not always a 1:1 match.  

By far the most difficult aspect was managing the shape of the data between the front-end, back-end, and database:

1. The front-end displays start and end times, which are not columns in the database.
2. The application uses Date objects, but fetch calls convert them into strings.
3. The back-end had to interpret the generated start and end *times* to pull the correct data from the start and end *date* columns in a way that is both sortable and filterable.
4. The entire application needs to properly handle requests coming from clients in any timezone.

So, I did the best that I could to overcome the challenges and did, however clumsily that turned out to be. I started getting major project fatigue towards the end of it, and I had to remember why I did it in the first place: to learn about some web technologies I hadn't yet experienced. No one is paying me to do it, I'm the only user of the platform, and I'm not working on it full-time to get it anywhere close to perfect.

### Security

In today's internet, a website won't survive very long without some protection. Security is hard, one poorly written line of code and suddenly some bad actor has your [uranium enrichment facility on the fritz](https://en.wikipedia.org/wiki/Stuxnet#Natanz_nuclear_facilities) or you're [leaking everyone's DNA all over the internet](https://en.wikipedia.org/wiki/23andMe_data_leak)¹. This is why I've entrusted my site's security to [**`nuxt-auth-utils`**](https://nuxt.com/modules/auth-utils) and [**`nuxt-security`**](https://nuxt.com/modules/security). This is not a project to explore secure design practices, and the data stored on it is not particularly sensitive, so I wasn't going to spend a lot of time on it. But I also didn't want to put it all out there without some sort of defense. To the white hat folks out there, please [email me](mailto:security@roamers.rest) if you find something egregiously wrong with my website's security.

¹ Yes, this is a gross oversimplification of how these two incidents occurred, but the stories are sensational and highight the importance of good security practices.

### Project management

Javascript doesn't really mind how you use it. It's very powerful and lets you get away with some pretty crazy stuff. The downside is that the code you write can start to behave erratically if you sloppily write something that seems to work, but is built out of bubblegum and popsicle sticks. Typically, this is more of a concern for large, team-based projects, but I wanted to enforce some kind of standard on myself.

[**Typescript**](https://www.typescriptlang.org/) introduces build-time type safety and a level of self-documentation to Javascript. Read [their article](https://www.typescriptlang.org/why-create-typescript/) justifying their existence to understand why this is important.

[**Biome.js**](https://biomejs.dev/) keeps me on the straight and narrow by calling me out for poorly designed code via its linting rules. It's formatter also keeps my files looking sharp (although, it annoyingly doesn't fully support `.vue` and tailwind `.css` files).

[**Knip**](https://knip.dev/) keeps my project from getting bloated with unused dependencies and dead code. However, it seems to get pretty confused by Nuxt's auto-import feature, and they [even suggest you disable it](https://knip.dev/reference/plugins/nuxt#note) to get the best results.

This one goes out to my pals [node.js](https://nodejs.org/en) and [npm](https://www.npmjs.com/), the unsung heroes that make programming in Javascript a team sport. When one person writes great software, all it takes is a quick `npm i` and we all benefit from it.

### Testing

Ha, who has time for that? We have features to push!

In all seriousness, this is very important and I should get around to it sooner rather than later so that the towering stack of cards that represents my interconnected code doesn't come crashing to the ground when I make one small change.

### Deployment

This is my first-ever website hosted on the real Internet whose deployment details aren't abstracted away by [GitHub pages](https://pages.github.com/) or [PythonAnywhere](https://www.pythonanywhere.com/). While these services were instrumental to my journey as a web developer, it was time to put on my big boy pants and figure it out myself.

The first thing I needed was a domain to legitimize my website and give users a web address to access it. [**Porkbun**](https://porkbun.com/) very happily sold me two (I only needed one, but at $12 each I couldn't resist). They also gave me an easy way to [tell the rest of the internet](https://www.cloudflare.com/learning/dns/dns-records/) that my website lives here.

Next, I needed to put my project on a server that could handle the level of traffic I anticipated (me and a few of [my friends](https://i.imgflip.com/4mxy0p.png)). This project also has the particular limitation of using SQLite. Since SQLite stores data in a file within the project, it did not qualify for serverless and auto scaling services that dynamically spin up new instances as web traffic increases. By their very nature, these services would delete my web app and its SQLite file with it without me even knowing. This lead me to a [Virtual Private Server](https://cloud.google.com/learn/what-is-a-virtual-private-server) provided by [**Racknerd**](https://www.racknerd.com/kvm-vps). I chose them because they were arguably the cheapest service that did not seem to sacrifice on quality, but [Hetzner](https://www.hetzner.com/cloud/) came in as a close second.

Once I was equipped with a VPS, I used [**Caddy**](https://caddyserver.com/) to accept inbound requests and shuffle them off to the relevant destination (this web app), and [**PM2**](https://pm2.keymetrics.io/docs/usage/quick-start/) to keep the web app running as a long running process.

To get the project to the server, I used the [**Git CLI**](https://git-scm.com/book/en/v2/Getting-Started-The-Command-Line) to clone the repo from [**GitHub**](https://github.com/rsmith531/online_hours_tracker) over SSH. This is a very manual process and I am desperately in need of a good CI pipeline, once I figure out how to do all that.

### Miscellaneous

This document you are viewing right now is actually [my project's README.md](https://github.com/rsmith531/online_hours_tracker/blob/main/README.md). I used this cool library called [**`showdown`**](https://www.npmjs.com/package/showdown) to convert the Markdown file into HTML that I can render on the website. I wanted to provide some information about the project in the repository and on the website without having to maintain it in two places. This is my answer.

## Roadmap

### v1.0.0

- [x] The workday stopwatch that shows: 
    - [x] Current time spent working.
    - [x] Time spent on last workday.
- [x] User flow to start, stop, pause, and unpause workday.
- [x] Workday data persistence through SQLite at an API endpoint.
- [x] Data retrieval and caching through Vue-query.
- [x] Theming, styling, fonts, and responsive design.
- [x] Workday push notifications to clients through:
    - [x] Service workers to run code on the client,
    - [x]  `web-push` to send notifications from the server and,
    - [x] Browser Push API to display notifications to the user.
- [x] Client-based persistent notifications settings through local storage API.
- [x] Very basic auth through `nuxt-auth-utils` to protect website and API endpoints.

### v1.1.0

- [ ] Fully type the project and correct type errors.
    - [ ] API endpoints through [`zod`](https://zod.dev/?id=introduction).
    - [ ] ~~Database queries through [`kysely`](https://kysely.dev/docs/getting-started).~~ Not necessary now that I use an ORM.
    - [x] Harness Nuxt and Vue TypeScript capabilities.
- [ ] ~~Turn off Nuxt auto-imports.~~ There is too much involved in this to make it viable for a personal project at this stage.
- [ ] Write comprehensive test suites (one day).
- [ ] Create a CI/CD pipeline.
- [x] Upgrade the push notification to take you to the site when you click it.
- [x] Dark mode 😎
- [x] Live workday status updates via `socket.io` and websockets.
- [ ] implement [nuxt-api-shield](https://nuxt.com/modules/api-shield)

### v1.2.0

- [x] Workday Timeline feature.
    - [ ] ~~Probably use [Chart.js line chart](https://www.chartjs.org/docs/latest/charts/line.html) but without the chart.~~ Actually ended up with [a D3.js line chart](https://observablehq.com/@d3/line-chart/2)

### v1.3.0

- [ ] Migrate from SQLite to a PostgreSQL database.
    - [ ] Possible implementation of a self-hosted [Supabase](https://supabase.com/docs/guides/self-hosting) instance.
    - [x] Use an ORM library like [Drizzle](https://orm.drizzle.team/).
- [ ] Workday data editor.
    - [ ] Implemented through the [PrimeVue DataTable component](https://primevue.org/datatable/).
    - [ ] download data as csv button.

### v1.4.0

- [ ] Workday data dashboard.

## Resources

- [How to use Primevue Toast outside of a component](https://stackoverflow.com/questions/72425297/vue-warn-inject-can-only-be-used-inside-setup-or-functional-components)
- [How to make a push notification service worker](https://javascript.plainenglish.io/push-notifications-using-a-service-worker-5f2e371774e)
- [How to see console logs for service worker](https://discourse.mozilla.org/t/how-to-enable-console-log-from-service-worker/130394/8)
- [HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [How to do basic Nuxt auth](https://nuxt.com/docs/guide/recipes/sessions-and-authentication)
- [Putting a Nuxt3 app on a VPS](https://dev.to/wimadev/deploy-a-nuxt-3-app-on-a-vps-minimal-setup-3h91)
- [Vue plugins vs. composables vs. stores](https://bigmachine.io/frontend/what-should-be-a-plugin-vs-a-composable-vs-a-store-in-nuxt)
- [Good practices and Design Patterns for Vue Composables](https://dev.to/jacobandrewsky/good-practices-and-design-patterns-for-vue-composables-24lk)
- [Common push notification patterns](https://web.dev/articles/push-notifications-common-notification-patterns)
- [A very cool 7-segment font](https://www.keshikan.net/fonts-e.html)
- [How to install DNS provider modules in Caddy 2](https://caddy.community/t/how-to-use-dns-provider-modules-in-caddy-2/8148)
- [How to use D3.js in Vue](https://blog.logrocket.com/data-visualization-vue-js-d3/)
- Literally every doc for any library I used
- Google's [Gemini](https://gemini.google.com/) and Phind's [70b](https://www.phind.com/) AIs (I won't hide it)
- My friend, [M***h](https://mitch.website/)

## Contributors

See [`CONTRIBUTING.md`](https://github.com/rsmith531/online_hours_tracker/blob/main/CONTRIBUTING.md).

## Get in touch

Find me on [LinkedIn](https://www.linkedin.com/in/ryan-smith-163889173/), [GitHub](https://github.com/rsmith531), or [email me](mailto:inquiries@roamers.rest).
