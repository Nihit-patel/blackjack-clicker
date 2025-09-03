/*
This file is responsible for the cookie-clicker-esque game. The user can regenerate their balance by
clicking on the money bill. They can also click on other items that spawn which give greater sums of 
money. 
*/

// this is the main class for the different types of items that will spawn
class Item {
  constructor(
    probability,
    value,
    name,
    size,
    lifetime,
    spawnLimit,
    soundTap,
    image
  ) {
    this.probability = probability; // probability of the item spawning (?/100)
    this.value = value; // the amount that the item will count for
    this.name = name; // the name of the item
    this.size = size; // the size of the image for the item (width)
    this.lifetime = lifetime * 1000; // the amount of time that the item will stay on the screen for (ms)
    this.spawnLimit = spawnLimit; // the number of items for the specific category to exist at once
    this.soundTap = soundTap; // the sound the item makes when clicked
    this.image = image; // the image of the item
  }
}

// this is an item, and a subclass of the Item class
class Gold_Coin extends Item {
  constructor() {
    super(
      50,
      25,
      "Gold Coin",
      "70px",
      6,
      3,
      soundGold_Coin,
      "/pictures/gold_coin.png"
    );
  }
}

// this is an item, and a subclass of the Item class
class Diamond extends Item {
  constructor() {
    super(
      2,
      500,
      "Diamond",
      "50px",
      6,
      1,
      soundDiamond,
      "/pictures/diamond.png"
    );
  }
}

// this is an item, and a subclass of the Item class
class Ruby extends Item {
  constructor() {
    super(10, 100, "Ruby", "30px", 6, 2, soundRuby, "/pictures/ruby.png");
  }
}

// Global variables for the money clicker file
const moneyclick = document.getElementById("moneyclickerBtn"); // the money bill that is clicked

// Click event attached to the money bill
moneyclick.addEventListener("click", function () {
  increaseUserBalance("dollar_bill");
  updateBalance();
  soundClick.play();
});

// initial values
let isSpawning = false; // spawning is false (turned off)
let spawnTimer = null; // there is no spawn timer

// items that are currently spawned
let activeItems = {
  gold_coin: 0,
  diamond: 0,
  ruby: 0,
};

// sounds for the items
const soundGold_Coin = new GameSound("/audio/gold_coin.mp3", 0.4);
const soundDiamond = new GameSound("/audio/diamond.mp3", 0.4);
const soundRuby = new GameSound("/audio/ruby.mp3", 0.4);

// instanciate the different types of items
const itemTypes = {
  gold_coin: new Gold_Coin(),
  diamond: new Diamond(),
  ruby: new Ruby(),
};

// Initialize the money clicker page
function initMoneyClicker() {
  getUserBalance();
  updateBalance();
  randomSpawnsStart();
}

// increase the user's balance based on item that was clicked (communicate with server)
async function increaseUserBalance(item = "dollar_bill") {
  try {
    const response = await fetch(`/api/moneyclicker/click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ item }),
      // // body: JSON.stringify({ betAmount, action })
    });

    const data = await response.json();

    if (response.ok) {
      balanceDisplay = data.balance;
      updateBalance();
      console.log(data.message);
      return data.balance;
    } else {
      console.error("Error updating balance:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Network error:", error);
    return null;
  }
}

function randomSpawnsStart() {
  if (isSpawning) return;
  else {
    isSpawning = true;
    scheduleNextSpawn();
  }
}

function scheduleNextSpawn() {
  if (!isSpawning) return;
  else {
    const minTime = 2500;
    const maxTime = 10000;
    const timeForSpawn = Math.random() * (maxTime - minTime) + minTime;

    spawnTimer = setTimeout(() => {
      attemptSpawn();
      scheduleNextSpawn();
    }, timeForSpawn);
  }
}

function attemptSpawn() {
  const mainGame = document.querySelector(".main-game");

  const itemType = randomItem();

  if (itemType && canSpawnItem(itemType)) spawnItemByType(itemType, mainGame);
  else console.log("Cannot Spawn");
}

function randomItem() {
  const roll = Math.random() * 100;
  let cummulativeProbability = 0;

  for (const [itemKey, itemConfig] of Object.entries(itemTypes)) {
    cummulativeProbability += itemConfig.probability;
    if (roll <= cummulativeProbability) {
      return itemKey;
    }
  }
}

function canSpawnItem(itemType) {
  const config = itemTypes[itemType];
  return activeItems[itemType] < config.spawnLimit;
}

function spawnItemByType(itemType, container) {
  const config = itemTypes[itemType];

  // Create the item element
  const item = document.createElement("img");
  item.className = `spawned-item ${itemType}`;
  item.dataset.itemType = itemType;
  item.src = config.image;

  // Style the item
  item.style.position = "absolute";
  item.style.cursor = "pointer";
  item.style.userSelect = "none";
  item.style.zIndex = "100";
  item.style.transition = "transform 0.1s ease";
  item.style.width = config.size;
  // item.style.height = config.size;
  item.style.animation = "fadeOut 2s forwards";

  // Get random position
  const position = getRandomPosition(container);
  item.style.left = position.x + "px";
  item.style.top = position.y + "px";

  // Add hover effects
  item.addEventListener("mouseenter", () => {
    item.style.transform = "scale(1.2)";
  });
  item.addEventListener("mouseleave", () => {
    item.style.transform = "scale(1)";
  });

  // Add click handler
  item.addEventListener("click", async (event) => {
    // Visual feedback
    item.style.transform = "scale(0.8)";

    // Play sound if available
    config.soundTap.play();

    // Update balance
    await increaseUserBalance(config); // testing with config, probs better

    // Remove  item
    removeItem(item, itemType);
  });

  container.appendChild(item);
  activeItems[itemType]++;

  // Auto-remove after lifetime
  setTimeout(() => {
    if (item.parentNode) {
      removeItem(item, itemType);
    }
  }, config.lifetime);
}

function getRandomPosition(container) {
  const maxX = container.offsetWidth - 80;
  const maxY = container.offsetHeight - 80;

  let x, y;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    x = Math.random() * maxX + 40;
    y = Math.random() * maxY + 40;
    attempts++;
  } while (isPositionTooClose(x, y, container) && attempts < maxAttempts);

  return { x, y };
}

function isPositionTooClose(x, y, container) {
  const centerX = container.offsetWidth / 2;
  const centerY = container.offsetHeight / 2;
  const minDistanceNeeded = 200;

  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  return distance < minDistanceNeeded;
}

function removeItem(item, itemType) {
  if (item.parentNode) {
    item.style.animation = "itemDisappear 0.3s ease-out forwards";
    setTimeout(() => {
      item.parentNode.removeChild(item);
    }, 300);
  }
  activeItems[itemType]--;
}

function stopSpawning() {
  isSpawning = false;
  if (spawnTimer) {
    clearTimeout(spawnTimer);
    spawnTimer = null;
  }
}

// function getSpawnStats() {
//   console.log('Current active items:', activeItems);
//   console.log('Item probabilities:',
//     Object.entries(itemTypes).map(([type, config]) =>
//       `${type}: ${config.probability}% (max ${config.spawnLimit})`
//     )
//   );
// }
