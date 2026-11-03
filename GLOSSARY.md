# Next Bite

A web app for tracking restaurant recommendations from friends and randomly picking where to eat.

## Language

**Restaurant**: A dining establishment discovered by a friend. Each restaurant has a name, cuisine
type, location (a Google Maps place), opening hours, an emoji rating, optional notes, and optional
photos. _Avoid_: Place, venue, spot

**Friend**: A person who discovers or recommends restaurants. Each restaurant is attributed to
exactly one friend. A user manages their own list of friends. _Avoid_: Contact, recommender,
reviewer

**User**: An authenticated person using the app. A user owns their friend list and restaurant
collection. There is no sharing or multi-user collaboration — each user has an independent dataset.
_Avoid_: Account, member, profile

**Wheel**: A randomized selection mechanism that picks one restaurant from the user's collection.
Supports filtering by friend, by "open now" status, and a manual target count. _Avoid_: Spinner,
roulette, randomizer

**Rating**: A score from 1 to 7 represented as an emoji: 🫥 (terrible), 😞 (bad), 😐 (okay), 🙂
(good), 😊 (great), 🤩 (outstanding), 🍆 (legendary). Set by the user for each restaurant they've
tried. _Avoid_: Score, stars, grade

**Cuisine**: A free-text label describing the type of food a restaurant serves. Not a controlled
vocabulary. _Avoid_: Food type, category, genre

**Location**: A physical address resolved via Google Maps Places. Includes place name, street
address, city, postal code, and geographic coordinates. _Avoid_: Address, venue, place

**Opening Hours**: A structured schedule by day of week indicating when a restaurant is open.
Sourced from Google Maps Places API. Used for the "open now" filter and to display hours on
restaurant cards. _Avoid_: Schedule, business hours, times
