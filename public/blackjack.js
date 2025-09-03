/*
This file handles DOM manipulations as well as the logic for the blackjack game.
It keeps the visual content updated with the backend using vanilla JavaScript. 
*/
"use strict";
let balance = 0;

// Selecting DOM elements

// Buttons
const btnHit = document.querySelector(".btn-hit");
const btnStand = document.querySelector(".btn-stand");
const btnNewGame = document.querySelector(".btn-new");
const btnPlay = document.querySelector(".btn-play");

// Chips
const btnChips = document.querySelectorAll(".poker-chips img");
const btnChip_all_in = document.getElementById("chip_all_in");

// Labels
const labelScorePlayer = document.getElementById("score--player");
const labelScoreDealer = document.getElementById("score--dealer");
const labelBet = document.getElementById("bet");
const labelMessageResult = document.getElementById("message-result");

// Containers
const containerPlayer = document.querySelector(".player-area");
const containerDealer = document.querySelector(".dealer-area");
const containerPlayerHand = document.getElementById("player-hand");
const containerDealerHand = document.getElementById("dealer-hand");
const containerChipsBet = document.querySelector(".chips-bet");
const containerTable = document.querySelector(".table-container");
const containerPokerChips = document.querySelector(".poker-chips");

// Card values for Blackjack
const cardValues = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 10,
  Q: 10,
  K: 10,
  A: 11, // or 1, handled in logic
};

// Deck of cards
const suits = ["hearts", "diamonds", "clubs", "spades"];
const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];

const numberOfDecks = 4; // Deck 0-6; # of decks used

let deck,
  playerHand,
  dealerHand,
  playerHandTotal,
  dealerHandTotal,
  countPlayer,
  countDealer;

let betAmount = 0;
let winAmount;

let chipTracker;

// Starting conditions
const initBlackjack = async function () {
  deck = createDeck();
  shuffleDeck(deck);

  await getUserBalance();
  updateDisabledChips();

  playerHand = [];
  dealerHand = [];
  playerHandTotal = 0;
  dealerHandTotal = 0;

  labelScorePlayer.textContent = 0;
  labelScoreDealer.textContent = 0;
  labelMessageResult.textContent = "";

  containerPlayerHand.innerHTML = "";
  containerDealerHand.innerHTML = "";

  countPlayer = -1;
  countDealer = -1;

  containerPlayer.classList.add("hidden");
  containerDealer.classList.add("hidden");
  containerPlayer.classList.remove("win", "lose", "push");
  containerDealer.classList.remove("win", "lose", "push");
  labelMessageResult.classList.add("hidden");
  containerTable.classList.remove("blurred");

  containerPokerChips.classList.remove("hidden");

  chipsShow();
  betAmount = 0;
  updateBetAmount();

  btnPlay.classList.remove("hidden");
  btnNewGame.classList.add("hidden");
  btnHit.classList.add("hidden");
  btnStand.classList.add("hidden");

  containerChipsBet.innerHTML = "";

  containerChipsBet.addEventListener("click", removeChip);
  containerChipsBet.classList.remove("disabled");

  chipTracker = {
    1: [],
    5: [],
    10: [],
    25: [],
    50: [],
    100: [],
    1000: [],
    5000: [],
    10000: [],
  };
};

function displayCardDown(handEl) {
  handEl.innerHTML += "<img src='pictures/card_back.png'>";
}
function displayCardUp(hand, handEl, count) {
  handEl.innerHTML += `<img src='pictures/${hand[count].suit}_${hand[count].rank}.png'>`;
}
function displayCardPlayer() {
  countPlayer++;
  displayCardUp(playerHand, containerPlayerHand, countPlayer);
}
function displayCardDealer() {
  countDealer++;
  displayCardUp(dealerHand, containerDealerHand, countDealer);
}
function displayTotal(score, handTotal) {
  score.textContent = handTotal;
}
function displayTotalPlayer() {
  displayTotal(labelScorePlayer, playerHandTotal);
}
function displayTotalDealer() {
  displayTotal(labelScoreDealer, dealerHandTotal);
}
function disableChips() {
  containerChipsBet.removeEventListener("click", removeChip);
  containerChipsBet.classList.add("disabled");
}
async function play() {
  disableChips();
  btnPlay.classList.add("hidden");
  chipsHide();
  containerPlayer.classList.remove("hidden");
  containerDealer.classList.remove("hidden");
  updateUserBalance(betAmount, "bet");
  containerPokerChips.classList.add("hidden");
  updateBalance();

  playerHand = [];
  dealerHand = [];
  playerHandTotal = 0;
  dealerHandTotal = 0;
  countPlayer = -1;
  countDealer = -1;
  containerPlayerHand.innerHTML = "";
  containerDealerHand.innerHTML = "";

  playerHand.push(dealCard()); //show
  displayCardPlayer();
  playerHandTotal = handTotal(playerHand);
  displayTotalPlayer();

  await delay(0.5);

  dealerHand.push(dealCard()); //show
  displayCardDealer();
  dealerHandTotal = handTotal(dealerHand);
  displayTotalDealer();

  await delay(0.5);

  playerHand.push(dealCard()); //show
  displayCardPlayer();
  playerHandTotal = handTotal(playerHand);
  displayTotalPlayer();

  //dealer 2nd card:
  displayCardDown(containerDealerHand);

  playerHandTotal = handTotal(playerHand);
  displayTotalPlayer();

  dealerHandTotal = handTotal(dealerHand);
  displayTotalDealer();

  controlsEnd();

  checkForBlackjack();
}
function checkForBlackjack() {
  if (playerHandTotal === 21) {
    // if player has blackjack
    containerDealerHand.removeChild(containerDealerHand.lastChild);
    playerHandTotal = handTotal(playerHand);
    dealerHand.push(dealCard());
    dealerHandTotal = handTotal(dealerHand);
    displayTotalDealer();
    displayCardDealer();
    if (dealerHandTotal === 21) dealerPush(); // if dealer also has blackjack
    else win_blackjack();
    return;
  } else {
    dealerHand.push(dealCard());
    dealerHandTotal = handTotal(dealerHand);
    if (dealerHandTotal === 21) {
      // if dealer has blackjack but not player
      containerDealerHand.removeChild(containerDealerHand.lastChild);
      displayCardDealer();
      displayTotalDealer();
      dealerBlackjack();
    }
  }
}

// Hit functionality
btnHit.addEventListener("click", function () {
  hit(playerHand);
  playerHandTotal = handTotal(playerHand);
  displayCardPlayer();
  displayTotalPlayer();

  if (playerHandTotal > 21) {
    bust();
  }
  soundClick.play();
});

btnStand.addEventListener("click", function () {
  stand();
});

btnNewGame.addEventListener("click", function () {
  initBlackjack();
  betAmount = 0; // fix to chips getting disabled after large bet
  soundClick.play();
});

btnPlay.addEventListener("click", function () {
  if (validateBet()) play();
  else {
  } // finish function
  soundClick.play();
});

// Basic card functions
function createDeck() {
  const deck = [];
  for (let i = 0; i < numberOfDecks; i++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ deckNumber: i, suit, rank, value: cardValues[rank] });
      }
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
  return deck;
}

// Deal a card
function dealCard() {
  return deck.pop();
}

function hit(hand) {
  hand.push(dealCard());
}

async function stand() {
  // show dealer's card.
  containerDealerHand.removeChild(containerDealerHand.lastChild);
  playerHandTotal = handTotal(playerHand);
  displayTotalDealer();
  displayCardDealer();
  btnHit.classList.add("hidden");
  btnStand.classList.add("hidden");

  while (dealerHandTotal < 17) {
    // dealer hits until at least 17
    hit(dealerHand);
    dealerHandTotal = handTotal(dealerHand);
    await delay(1.5); // bcuz want the hit and stand button to be removed
    displayTotalDealer();
    displayCardDealer();
    if (dealerHandTotal > 17) await delay(1); // round over
  }

  if (dealerHandTotal > 21) win_dealerBust(); // dealer busts
  else if (dealerHandTotal > playerHandTotal) lose(); // dealer beats player
  else if (dealerHandTotal < playerHandTotal) win(); // player beats dealer
  else if (dealerHandTotal === playerHandTotal) dealerPush(); // tie
}

function handTotal(hand) {
  let aces = 0;
  let handValue = hand.reduce((total, card) => {
    if (card.rank === "A") aces++; // handle aces as value of 1 or 11
    return total + card.value;
  }, 0);

  while (handValue > 21 && aces) {
    handValue -= 10; // because they have a value of 1
    aces--;
  }
  return handValue;
}

// Results of a game of poker
async function win() {
  resultMessage(`You Win $${betAmount * 2}!`);
  controlsStart();
  playerWins();
  updateBalance();

  // new implementations using DB
  await updateUserBalance(betAmount, "win");
  soundWin.play();
}

async function win_blackjack() {
  resultMessage(`BlackJack! You Win $${betAmount * 2.5}`);
  controlsStart();
  playerWins();
  updateBalance();

  // new implementations using DB
  await updateUserBalance(betAmount, "blackjack");
  soundWin.play();
}

async function dealerBlackjack() {
  resultMessage(`Dealer Blackjack!`);
  controlsStart();
  playerLoses();
  updateBalance();

  // new implementations using DB
  await updateUserBalance(betAmount, "lose");
  soundLose.play();
}

async function win_dealerBust() {
  resultMessage(`Dealer Busts! You Win $${betAmount * 2}!`); // FIX THE WIN AMOUNT
  controlsStart();
  playerWins();
  updateBalance();

  // new implementations using DB
  await updateUserBalance(betAmount, "win");
  soundWin.play();
}

async function lose() {
  resultMessage(`Dealer Wins!`);
  controlsStart();
  playerLoses();
  updateBalance();

  // new implementations using DB
  await updateUserBalance(betAmount, "lose");
  soundLose.play();
}

async function dealerPush() {
  resultMessage(`Push (${playerHandTotal})`);
  controlsStart();
  updateBalance();
  containerPlayer.classList.add("push");
  containerDealer.classList.add("push");

  // new implementations using DB
  await updateUserBalance(betAmount, "push");
}

async function bust() {
  resultMessage(`You Bust! (${playerHandTotal})`);
  controlsStart();
  playerLoses();
  updateBalance();

  // new implementations using DB
  await updateUserBalance(betAmount, "lose");
  soundLose.play();
}

// Functions to handle buttons/game controls
async function controlsStart() {
  btnHit.classList.add("hidden");
  btnStand.classList.add("hidden");
  await delay(3);
  btnNewGame.classList.remove("hidden");
}
function controlsEnd() {
  btnHit.classList.remove("hidden");
  btnStand.classList.remove("hidden");
  btnNewGame.classList.add("hidden");
}

// Visual css for poker game result
async function playerWins() {
  await delay(0.5);
  containerPlayer.classList.add("win");
  containerDealer.classList.add("lose");
}
async function playerLoses() {
  await delay(0.5);
  containerPlayer.classList.add("lose");
  containerDealer.classList.add("win");
}

btnChips.forEach(function (chip) {
  // handle chips
  chip.addEventListener("click", function () {
    const value = Number(chip.dataset.value) || "all_in";
    if (value === "all_in" && balance > 0) {
      betAmount = balance;
      addChip(value);
      balanceDisplay = 0;
      soundPokerchip_all_in.play();
    } else if (validateBalance(value)) {
      betAmount += value;
      addChip(value);
      balanceDisplay -= value;
      soundPokerchip_place.play();
    }
    updateBetAmount();
    updateBalance();
    updateDisabledChips();
  });
});

function updateDisabledChips() {
  // unable/disable chips based on balance and bet amount
  btnChips.forEach((chip) => {
    const value = Number(chip.dataset.value) || "all_in";

    if (value === "all_in") {
      if (balance === 0) chip.classList.add("disabled");
      else chip.classList.remove("disabled");
    } else {
      if (betAmount + value > balance) {
        chip.classList.add("disabled");
      } else {
        chip.classList.remove("disabled");
      }
    }
  });
}

function updateBetAmount() {
  labelBet.innerHTML = `Bet: $${betAmount}`;
}

// hide chips
function chipsHide() {
  btnChips.forEach(function (chip) {
    chip.classList.add("hidden");
  });
  containerPokerChips.classList.add("hidden");
}

// show chips
function chipsShow() {
  btnChips.forEach(function (chip) {
    chip.classList.remove("hidden");
  });
  containerPokerChips.classList.remove("hidden");
}

let chipCount = 0;

// add chips
function addChip(value) {
  chipCount++;
  const chipId = `bet_chip_${value}_${chipCount}`;
  let chip = `<img src="pictures/chip_${value}.png" alt="${value}$ chip" id="${chipId}" />`;

  if (value === "all_in") {
    containerChipsBet.innerHTML = chip;
    return chipId;
  } else {
    containerChipsBet.innerHTML += chip;
    chipTracker[value].push(chipId);
    console.log(chipTracker);
    combineChips(value);
    return chipId;
  }
}

// Handle chip removal
// Implement removeChip to remove the chip and update bet
function removeChipAssist(chipId, value) {
  const chipEl = document.getElementById(chipId);
  if (chipEl) {
    chipEl.remove();

    // Handle all_in chip differently
    if (value === "all_in") {
      balanceDisplay += betAmount; // Add back the full bet amount
      betAmount = 0;
    } else {
      // Handle regular chips
      const index = chipTracker[value].indexOf(chipId);
      if (index !== -1) chipTracker[value].splice(index, 1);

      betAmount -= value;
      balanceDisplay += value;
    }

    updateBetAmount();
    updateBalance();
  }
}

function removeChip(e) {
  if (e.target.tagName === "IMG" && e.target.id.startsWith("bet_chip_")) {
    // Parse value from id
    const parts = e.target.id.split("_");
    const value = Number(parts[2]) || "all_in"; // This will be either a number or "all_in"

    removeChipAssist(e.target.id, value);
    updateDisabledChips();
  }
}

// Combining chips if the chips on the table can be reduced to fewer chips with same value
function combineChips(value) {
  // Basic combining logic for 5 chips of a value -> 1 chip of value*5
  // 1 -> 5, 10 -> 50, 1000 -> 5000
  if (
    (value === 1 || value === 10 || value === 1000) &&
    chipTracker[value].length >= 5
  ) {
    // Remove 5 $1 / $10 / $1000 chips
    for (let i = 0; i < 5; i++) {
      const chipId = chipTracker[value][i];
      const chipEl = document.getElementById(chipId);
      if (chipEl) chipEl.remove();
    }
    chipTracker[value].splice(0, 5);

    // Add 1 $5 / $50 / $5000 chip
    addChip(value * 5);
    updateBetAmount();
  }

  // Basic combining logic for 2 chips of 10$ and 1 chip of 5$ -> 1 chip of $25
  else if (chipTracker[5].length >= 1 && chipTracker[10].length >= 2) {
    // Remove 2 10$ chips and 1 5$ chip
    for (let i = 0; i < 2; i++) {
      const chipId = chipTracker[10][i];
      const chipEl = document.getElementById(chipId);
      if (chipEl) chipEl.remove();
    }

    chipTracker[10].splice(0, 2);

    const chipId = chipTracker[5][0];
    const chipEl = document.getElementById(chipId);
    if (chipEl) chipEl.remove();
    chipTracker[5].splice(0, 1);

    // Add 1 $25 chip
    addChip(25);
    updateBetAmount();
  }

  // Remove 2 chips of a value -> add 1 chip of 2*value
  else if (
    chipTracker[value].length >= 2 &&
    value !== 1 &&
    value !== 100 &&
    value !== 10 &&
    value !== 1000 &&
    value !== 10000
  ) {
    // Remove 2 chips
    for (let i = 0; i < 2; i++) {
      const chipId = chipTracker[value][i];
      const chipEl = document.getElementById(chipId);
      if (chipEl) chipEl.remove();
    }
    chipTracker[value].splice(0, 2);

    // Add 1 chip of twice the value
    addChip(value * 2);
    updateBetAmount();
  }

  // remove 10 chips of a value -> add 10 chips of 10*value
  else if (
    chipTracker[value].length >= 10 &&
    value !== 25 &&
    value !== 50 &&
    value !== 5000
  ) {
    // Remove 10 chips
    for (let i = 0; i < 10; i++) {
      const chipId = chipTracker[value][i];
      const chipEl = document.getElementById(chipId);
      if (chipEl) chipEl.remove();
    }
    chipTracker[value].splice(0, 10);

    // Add 1 chip of 10 times the value
    addChip(value * 10);
    updateBetAmount();
  }
}

// Betting no chips display
const messageCode = document.getElementById("message-code");

function validateBalance(chipValue) {
  if (betAmount + chipValue > balance) {
    return false;
  }
  return true;
}

// if the player is not betting any chips, warn them
function validateBet() {
  if (betAmount === 0) {
    messageCode.querySelector("p").textContent =
      "You are not betting any chips!";
    messageCode.classList.add("warning");
    messageCode.classList.remove("hidden"); // Show the alert immediately
    setTimeout(() => {
      messageCode.classList.add("hidden"); // Hide it after 3 seconds
    }, 1500);
  }
  return true;
}

// display message for the result of the game (win, lose, push, ...)
async function resultMessage(msg) {
  await delay(1.5);

  labelMessageResult.innerHTML = msg;
  labelMessageResult.classList.remove("hidden");
  containerTable.classList.add("blurred");
}

// Update balance on server
async function updateUserBalance(betAmount, action) {
  try {
    const response = await fetch("/api/balance/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ betAmount, action }),
    });

    const data = await response.json();

    if (response.ok) {
      balance = data.balance;
      updateBalance();
      console.log(data.message);
      return balance;
    } else {
      console.error("Error updating balance:", data.error);
      return null;
    }
  } catch (error) {
    console.error("Network error:", error);
    return null;
  }
}

// SOUNDS:

const soundWin = new GameSound("/audio/blackjack_win.mp3");
const soundLose = new GameSound("/audio/blackjack_lose.mp3");
// const soundPlay = new GameSound("/audio/blackjack_play.mp3");

const soundPokerchip_place = new GameSound(
  "/audio/blackjack_pokerchip_place.mp3"
);
const soundPokerchip_all_in = new GameSound(
  "/audio/blackjack_pokerchip_all_in.mp3"
);
