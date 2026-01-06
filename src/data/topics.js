export const topics = [
  // Animals (15)
  'A Cat Wearing a Hat',
  'A Dancing Elephant',
  'A Penguin on Vacation',
  'A Dog Astronaut',
  'A Sleeping Dragon',
  'A Fish Riding a Bicycle',
  'An Owl Reading a Book',
  'A Giraffe in a Sweater',
  'A Bear Having a Picnic',
  'A Rabbit Magician',
  'A Shark with a Mustache',
  'A Squirrel Hoarding Pizza',
  'A Koala DJ',
  'A Flamingo Ballet Dancer',
  'A Hedgehog in Roller Skates',

  // Fantasy & Imagination (15)
  'A House on Clouds',
  'A Robot Eating Ice Cream',
  'An Alien Playing Guitar',
  'A Flying Car',
  'A Tree with Doors',
  'A Castle Made of Candy',
  'A Wizard Cooking',
  'A Mermaid on a Skateboard',
  'A Unicorn Barista',
  'A Ghost Trying to Make Friends',
  'A Fairy Fixing a Computer',
  'A Giant Friendly Monster',
  'A Portal to Another World',
  'A Dragon Afraid of Fire',
  'A Time-Traveling Snail',

  // Food (12)
  'Pizza with a Face',
  'Dancing Vegetables',
  'A Taco Party',
  'A Hamburger Superhero',
  'Angry Spaghetti',
  'A Happy Cupcake',
  'Breakfast at Sunrise',
  'A Donut Police Officer',
  'Sushi Samurai',
  'An Avocado at the Gym',
  'Ice Cream Melting Dramatically',
  'A Cookie Breaking Up with Milk',

  // Objects & Scenes (15)
  'A Phone from the Future',
  'Your Dream Vacation',
  'A Rainy Day Indoors',
  "A Superhero's Lair",
  'A Haunted House',
  'A Beach at Sunset',
  'A Mountain with a Face',
  'A Car with Wings',
  'A Lamp That Grants Wishes',
  'A Cozy Reading Nook',
  'A Treehouse City',
  'An Underwater Restaurant',
  'A Rocket Ship Bedroom',
  'A Garden at Midnight',
  'A Library in Space',

  // Actions & Scenarios (15)
  'Someone Jumping Over a Puddle',
  'A Monster Under the Bed',
  'A Person Discovering Treasure',
  'Someone Trying to Catch a Butterfly',
  'A Detective Solving a Mystery',
  'A Chef in a Food Fight',
  'Someone Walking Their Pet Rock',
  'A Pirate Finding a Treasure Map',
  'An Explorer in a Jungle',
  'Someone Making a Wish on a Star',
  'A Ninja Doing Grocery Shopping',
  'A Cowboy Riding a Giant Chicken',
  'Someone Building a Sandcastle',
  'A Scientist with a Crazy Invention',
  'A Musician in a Band of Animals',

  // Abstract & Feelings (12)
  'What Happiness Looks Like',
  'Your Biggest Fear',
  'A Musical Note',
  'What Monday Feels Like',
  'The Feeling of Winning',
  'Time Travel',
  'A Dream You Remember',
  'What Friendship Looks Like',
  'The Taste of Your Favorite Food',
  'What Silence Sounds Like',
  'The Feeling of a Warm Hug',
  'What Adventure Feels Like',

  // Silly & Random (16)
  'A Potato with Legs',
  'A Cactus Needing a Hug',
  'A Cloud Having a Bad Hair Day',
  'A Banana Slipping on a Human',
  'A Sock That Lost Its Pair',
  'A Pencil Running a Marathon',
  'A Chair on Vacation',
  'A Coffee Cup Before 8am',
  'A Moon Wearing Sunglasses',
  'A Volcano Sneezing',
  'A Book Reading a Human',
  'Stairs Going Nowhere',
  'A Door That Leads to Yesterday',
  'A Shoe with Stage Fright',
  'A Clock That Hates Mornings',
  'An Umbrella Afraid of Rain',
];

// Track last used topic to avoid repeats
let lastTopic = '';

// Get a random topic that's different from the last one
export const getRandomTopic = () => {
  let newTopic;
  do {
    const randomIndex = Math.floor(Math.random() * topics.length);
    newTopic = topics[randomIndex];
  } while (newTopic === lastTopic && topics.length > 1);

  lastTopic = newTopic;
  return newTopic;
};

// Get multiple unique random topics
export const getRandomTopics = (count = 3) => {
  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, topics.length));
};
