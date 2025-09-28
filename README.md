# blackjack-clicker
This is an interactive online blackjack game that combined with a fun cookie-clicker style mini-game. It is a full-stack web game that uses JavaScript, HTML, CSS, NodeJS, Express and MySQL. It has a login feature for data persistence. The database works using XAAMP.

## Features

**Blackjack**
- Chips ranging from $1 to $10k and an all-in chip.
- Fully functional classic Blackjack logic (hit, stand).

**Cookie Clicker**
- Simple clicker game to gain currency again.
- Random item spawns giving lump of currency when clicked (diamond, ruby, gold coin).

**Persisting Data**
- User accounts and balances stored in a MySQL database.
- Login/Session handling using NodeJS.

**UI & Experience**
- Clean, responsive interface created using HTML, CSS, and vanilla JavaScript.
- Added sounds for better immersive experience.

## Tech Stack

**Frontend:** HTML, CSS, JavaScript  
**Backend:** Node.js, Express  
**Database:** MySQL (XAMPP for local development)  
**Other:** Cookie-based session handling 

## Future improvements:
- Leaderboards for top players.
- More games, Player vs Player (Multiplayer) modes.
- Progression system to keep players engaged.
- Better UI for mobile and desktop using React.
- Bug fixes:
  - User has access to spawn rate and values of items in MoneyClicker.js, so move to server side.
  - User is able to click a single item multiple times.

## Setup:

**Install Dependencies**
```npm install express-session cookie-parser express mysql2 bcrypt```

**SQL Setup**
```
CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
)
```

**Project Structure**
```
blackjack-clicker-game/
│
├── public/        # Static (Audio, pictures and JavaScript for game logic and visual cues)
├── views/         # HTML pages
└── server.js      # Node.js, Express routes and Database connection
```

**Start Server**
```
nodemon server.js
```

**Test it out:** https://blackjack-clicker-game.vercel.app/
