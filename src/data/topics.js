export const topics = [
  // Animals
  "A cat wearing a hat",
  "A dancing elephant",
  "A penguin on vacation",
  "A dog astronaut",
  "A sleeping dragon",
  "A fish riding a bicycle",
  "An owl reading a book",
  "A giraffe in a sweater",
  
  // Fantasy & Imagination
  "A house on clouds",
  "A robot eating ice cream",
  "An alien playing guitar",
  "A flying car",
  "A tree with doors",
  "A castle made of candy",
  "A wizard cooking",
  "A mermaid on a skateboard",
  
  // Food
  "Pizza with a face",
  "Dancing vegetables",
  "A taco party",
  "A hamburger superhero",
  "Angry spaghetti",
  "A happy cupcake",
  "Breakfast at sunrise",
  
  // Objects & Scenes
  "A phone from the future",
  "Your dream vacation",
  "A rainy day indoors",
  "A superhero's lair",
  "A haunted house",
  "A beach at sunset",
  "A mountain with a face",
  "A car with wings",
  
  // Actions
  "Someone jumping over a puddle",
  "A monster under the bed",
  "A person discovering treasure",
  "Someone trying to catch a butterfly",
  "A detective solving a mystery",
  
  // Abstract
  "What happiness looks like",
  "Your biggest fear",
  "A musical note",
  "What Monday feels like",
  "The feeling of winning",
  "Time travel",
  "A dream you remember",
];

export const getRandomTopic = () => {
  const randomIndex = Math.floor(Math.random() * topics.length);
  return topics[randomIndex];
};

