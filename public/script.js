/*
This is the general javascript file used by both the moneyclicker game and the blackjack games.
It contains basic common functions.
*/

let balanceDisplay = 0;

const balanceEl = document.getElementById("balance");

function updateBalance() {
  balanceEl.textContent = `Balance: $${balanceDisplay}`;
}

function delay(seconds) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// Sidebar:
function openNav() {
  document.getElementById("sidebarOpen").style.width = "250px";
  document.getElementById("main").classList.add("shifted");
}

function closeNav() {
  document.getElementById("sidebarOpen").style.width = "0";
  document.getElementById("main").classList.remove("shifted");
}

// retrieve a user's balance through the server
async function getUserBalance() {
  try {
    const response = await fetch("/api/balance");
    const data = await response.json();

    if (response.ok) {
      balance = data.balance;
      balanceDisplay = balance; // Add this line
      updateBalance(); // Add this line to immediately update display
      return balance;
    } else {
      console.error("Error getting balance:", data.error);
      // If user not logged in, you might want to redirect to login
      if (response.status === 401) {
        window.location.href = "/signup";
      }
      return 0;
    }
  } catch (error) {
    console.error("Network error:", error);
    return 0;
  }
}

// Sound manager class

class GameSound {
  constructor(src, volume = 1.0) {
    this.audio = new Audio(src);
    this.audio.preload = "auto";
    this.audio.volume = volume;
  }

  play() {
    this.audio.currentTime = 0; // restart from beginning if already playing
    this.audio.play().catch((err) => {
      console.warn("Audio play prevented by browser:", err);
    });
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

// Money click sound:
const soundClick = new GameSound("/audio/moneyclicker_click.wav", 0.5);
