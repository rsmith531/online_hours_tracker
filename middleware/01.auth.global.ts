// ~/middleware/01.auth.global.ts

// https://nuxt.com/docs/guide/recipes/sessions-and-authentication#protect-app-routes
export default defineNuxtRouteMiddleware((to) => {

  const { loggedIn } = useUserSession();

  // redirect the user to the login screen if they're not authenticated
  if (!loggedIn.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});
