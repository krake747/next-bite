# Next Bite

A web app for tracking restaurant recommendations from friends.

## Language

**Restaurant**: A dining establishment discovered by a friend. _Avoid_: Place, venue, spot

**Friend**: A person who discovers or recommends restaurants. A user manages their own list of
friends. _Avoid_: Contact, recommender, reviewer

**User**: An authenticated person using the app. A user owns their friend list and restaurant
collection, and sees restaurants shared with them by friends and groups. _Avoid_: Account, member,
profile in product copy. `Login` is allowed only for auth mechanics (sign in, sign up, your login).
A group role named `member` is part of `Group`, not a synonym for `User`.

**Rating**: A score from 1 to 7 represented as an emoji: 🫥 (terrible), 😞 (bad), 😐 (okay), 🙂
(good), 😊 (great), 🤩 (outstanding), 🍆 (legendary). Set by the user for each restaurant they've
tried. _Avoid_: Score, stars, grade

**Cuisine**: A free-text label describing the type of food a restaurant serves. Not a controlled
vocabulary. _Avoid_: Food type, category, genre

**Location**: A physical address resolved via Google Maps Places. Includes place name, street
address, city, postal code, and geographic coordinates. The Google provider spells it place; product
copy says location or restaurant. _Avoid_: Address, venue, place in product copy

**Opening Hours**: A structured schedule by day of week indicating when a restaurant is open.
Sourced from Google Maps Places API. Used for the "open now" filter and to display hours on
restaurant cards. _Avoid_: Schedule, business hours, times

**Group**: A named set of users who pool restaurant recommendations. Membership carries an admin or
member role. _Avoid_: Circle, crew

**Share**: A restaurant sent to a friend or a group. Each share records who sent it. _Avoid_:
Forward

**Invitation**: A token link inviting someone to connect as a friend or join a group. Friend
invitations are single-use; group links stay reusable. The verb invite is allowed (Invite your
friends, Send request); the noun is always invitation. _Avoid_: Invite, invite link as nouns

**Save**: A restaurant on the user's own short list. Shown under Saved restaurants.

**Plan**: A dated outing to a restaurant, optionally tied to a group. Participants join; a plan is
planned, done, or cancelled. _Avoid_: Event, meal plan

**Visit memory**: Photos from a visit to a restaurant, credited to the person who shared them.
_Avoid_: Memory

**Want**: A friend saying they want to try a restaurant. Rendered as Want to try with a count.

**Been**: A friend marking they already tried a restaurant. Rendered as Been with a count.

**Like**: A lightweight endorsement on a restaurant update, with a count.

**Comment**: A short text reply on a restaurant update, with a count.

**Friend update**: A friend's shared restaurant as shown under Latest from friends, with the
restaurant name, cuisine, notes, and like, comment, and want counts. _Avoid_: Activity, post,
reaction, feed item, social summary as product nouns.
