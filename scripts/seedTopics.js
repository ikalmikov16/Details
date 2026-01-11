/**
 * Seed Topics Script
 *
 * Run this script to generate JSON for Firebase.
 * Usage: node scripts/seedTopics.js
 *
 * Copy the output JSON into Firebase Console:
 * Firebase Console → Realtime Database → topics → Import JSON
 */

const topicsData = {
  version: 1,
  lastUpdated: Date.now(),
  themes: {
    everydayObjects: {
      name: 'Everyday Objects',
      emoji: '🧺',
      topics: [
        'A Coffee Mug',
        'A Chair',
        'A Pair of Glasses',
        'A Backpack',
        'A Phone',
        'A Shoe',
        'A Set of Keys',
        'A Lamp',
        'A Toothbrush',
        'A Clock',
      ],
    },

    animals: {
      name: 'Animals',
      emoji: '🐾',
      topics: [
        'A Cat',
        'A Dog',
        'A Bird',
        'A Fish',
        'A Turtle',
        'A Frog',
        'An Owl',
        'A Bear',
        'A Penguin',
        'A Horse',
      ],
    },

    food: {
      name: 'Food',
      emoji: '🍔',
      topics: [
        'A Cheeseburger',
        'A Slice of Pizza',
        'An Ice Cream Cone',
        'A Taco',
        'A Donut',
        'A Sandwich',
        'A Cupcake',
        'A Banana',
        'A Bowl of Noodles',
        'A Stack of Pancakes',
      ],
    },

    thingsWithFaces: {
      name: 'Things With Faces',
      emoji: '😄',
      topics: [
        'A Happy Sun',
        'A Sad Cloud',
        'A Grumpy Phone',
        'A Smiling House',
        'An Angry Alarm Clock',
        'A Nervous Backpack',
        'A Sleepy Moon',
        'A Laughing Car',
        'A Scared Shoe',
        'A Confused TV',
      ],
    },

    peopleDoingThings: {
      name: 'People Doing Things',
      emoji: '🏃',
      topics: [
        'Someone Running Late',
        'Someone Dancing',
        'Someone Sleeping',
        'Someone Lifting Something Heavy',
        'Someone Eating Messily',
        'Someone Falling Over',
        'Someone Taking a Selfie',
        'Someone Studying',
        'Someone Celebrating',
        'Someone Waiting in Line',
      ],
    },

    brokenThings: {
      name: 'Broken Things',
      emoji: '💥',
      topics: [
        "A Phone That Won't Turn On",
        "A Car That Won't Start",
        'A Computer With an Error Screen',
        'A Leaking Water Bottle',
        'A Cracked Mirror',
        'A Snapped Pencil',
        'A TV With No Signal',
        'A Chair Missing a Leg',
        'A Watch That Is Stuck',
        'A Jammed Door',
      ],
    },

    tinyVsGiant: {
      name: 'Tiny vs Giant',
      emoji: '🐜',
      topics: [
        'A Tiny Person and a Giant Coffee Cup',
        'A Tiny Dog and a Giant Cat',
        'A Tiny House and a Giant Tree',
        'A Tiny Phone and a Giant Hand',
        'A Tiny Car and a Giant Pothole',
        'A Tiny Chef and a Giant Burger',
        'A Tiny Boat and a Giant Wave',
        'A Tiny Backpack and a Giant Book',
        'A Tiny Kid and a Giant Slide',
        'A Tiny Mouse and a Giant Cheese',
      ],
    },

    sillyCombinations: {
      name: 'Silly Combinations',
      emoji: '🤪',
      topics: [
        'A Banana With Wheels',
        'A Fish With Legs',
        'A Pizza With Arms',
        'A Backpack With Eyes',
        'A Cat That Is Also a Loaf of Bread',
        'A Shoe With Teeth',
        'A Clock That Is Also a Donut',
        'A Tree Made of Candy',
        'A Car That Is Also a Bed',
        'A Cloud Wearing Shoes',
      ],
    },

    oneWeirdRule: {
      name: 'One Weird Rule',
      emoji: '🚫',
      topics: [
        'Draw a House Without Using Any Straight Lines',
        'Draw a Cat Using Only Circles',
        'Draw a Face Without Drawing Eyes',
        'Draw a Tree Using Only Straight Lines',
        'Draw a Car Without Lifting Your Finger',
        'Draw a Person Using Only Squares',
        'Draw a Sun Without Using Yellow',
        'Draw a Fish Using Only Three Shapes',
        'Draw a Phone Without Drawing a Rectangle',
        'Draw a Smile Using Only Dots',
      ],
    },

    dream: {
      name: 'Dream ___',
      emoji: '🌈',
      topics: [
        'Your Dream House',
        'Your Dream Vacation',
        'Your Dream Bedroom',
        'Your Dream Pet',
        'Your Dream Job',
        'Your Dream Car',
        'Your Dream City',
        'Your Dream Island',
        'Your Dream Restaurant',
        'Your Dream Weekend',
      ],
    },
  },
};

// Pretty print for copying to Firebase Console
console.log('='.repeat(70));
console.log('FIREBASE TOPICS DATA');
console.log('='.repeat(70));
console.log();
console.log('Copy the following JSON into Firebase Console:');
console.log('Firebase Console → Realtime Database → topics → Import JSON');
console.log();
console.log('='.repeat(70));
console.log();
console.log(JSON.stringify(topicsData, null, 2));
console.log();
console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log('Total themes:', Object.keys(topicsData.themes).length);

let total = 0;
for (const [key, theme] of Object.entries(topicsData.themes)) {
  console.log(`  ${theme.emoji} ${theme.name}: ${theme.topics.length} topics`);
  total += theme.topics.length;
}
console.log('-'.repeat(70));
console.log('TOTAL TOPICS:', total);
console.log('='.repeat(70));
