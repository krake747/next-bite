# Next Bite

A web app for tracking restaurant recommendations from friends.

## Language

**Restaurant**: A dining establishment discovered by a friend. _Avoid_: Place, venue, spot

**Friend**: A person who discovers or recommends restaurants. A user manages their own list of
friends. _Avoid_: Contact, recommender, reviewer

**User**: An authenticated person using the app. A user owns their friend list and restaurant
collection, and sees every restaurant their friends save plus those added to their groups. _Avoid_:
Account, member, profile in product copy. `Login` is allowed only for auth mechanics (sign in, sign
up, your login). A group role named `member` is part of `Group`, not a synonym for `User`.

**Cuisine**: A free-text label describing the type of food a restaurant serves. Not a controlled
vocabulary. _Avoid_: Food type, category, genre

**Location**: A physical address resolved via Google Maps Places. Includes place name, street
address, city, postal code, and geographic coordinates. The Google provider spells it place; product
copy says location or restaurant. _Avoid_: Address, venue, place in product copy

**Opening Hours**: A structured schedule by day of week indicating when a restaurant is open.
Sourced from Google Maps Places API. Used for the "open now" filter and to display hours on
restaurant cards. _Avoid_: Schedule, business hours, times

**Group**: A named set of users who pool restaurant recommendations. The creator owns it; everyone
else is a member. _Avoid_: Circle, crew

**Share**: A restaurant added to a group. Friends see every restaurant without one. Each share
records who added it. _Avoid_: Forward

**Invitation**: A token link inviting someone to connect as a friend or join a group. Friend
invitations are single-use; group links stay reusable. The verb invite is allowed (Invite your
friends, Send request); the noun is always invitation. _Avoid_: Invite, invite link as nouns

**Save**: A restaurant on the user's own short list. Shown under Saved restaurants.

**Plan**: A dated outing to a group place. Members are the participants; a plan is planned or
cancelled. _Avoid_: Event, meal plan

**Want**: A friend saying they want to try a restaurant. Rendered as Want to try with a count.

**Been**: A friend marking they already tried a restaurant. Rendered as Been with a count.

**Friend update**: A friend's shared restaurant as shown under Latest from friends, with the
restaurant name, cuisine, notes, and want counts. _Avoid_: Activity, post, reaction, feed item,
social summary as product nouns.
