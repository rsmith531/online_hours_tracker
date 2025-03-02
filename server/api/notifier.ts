// ~/server/api/notifier.ts

// POST

// create-subscription: adds the subscribing client's details to the subscriber list
// for now, this list can exist in an array or something
// in the future, maybe it should live in a sqlite file or other database?

// GET

// send-notification: will need to listen to the workday API to know the current working time
// at the intervals set by each subscriber, push a notification to them

// PATCH

// update-subscription: go look up the subscriber in the list and change the interval to the new interval

// DELETE

// remove-subscription: go find the subscriber in the list and remove it