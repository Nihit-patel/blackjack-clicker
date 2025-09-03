const express = require("express");
const fs = require("fs");
const app = express();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const session = require("express-session");

// Connect to database
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "blackjack_game",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: "secret_key_to_set",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS)
  })
);

function checkAuth(req, res, next) {
  req.isLoggedIn = !!(req.session && req.session.userId); // !! to convert to boolean
  req.currentUser =
    req.session && req.session.userId
      ? {
          id: req.session.userId,
          username: req.session.username,
        }
      : null;
  next();
}

app.use(checkAuth); // Middleware to check authentication status

const htmlSetup = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Blackjack</title>

    <link rel="stylesheet" href="/style.css">
  </head>`;

const header = `
<div id="main">
    <div class="header">
      <h1>Play Blackjack Online</h1>
      <img
        src="/pictures/Blackjack_logo.png"
        alt="blackjack logo 2 ace cards"
        class="logo"
      />
    </div>`;

function createFooter(pageURL) {
  return `
    <div class="disclaimer">
      <p>
        <em>Disclaimer:</em> This is a simulated game for entertainment purposes
        only. No real money is involved, and all funds displayed are purely
        fictional.
      </p>
    </div>
  </div>
    <script src="/script.js"></script>
    <script src="/${pageURL}.js"></script>
    </body>
    </html>
  `;
}

// Functions
function createPage(pageURL, bodyLoad = "<body>") {
  app.get(`/${pageURL}`, (req, res) => {
    let html = "";
    const footer = createFooter(pageURL);
    html +=
      htmlSetup +
      bodyLoad +
      header +
      fs.readFileSync(__dirname + `/views/${pageURL}.html`) +
      footer;
    res.send(html);
  });
}

// Running functions
createPage("blackjack", `<body onload="initBlackjack()">`);

createPage("moneyclicker", `<body onload="initMoneyClicker()">`);

// DEFFAULT PATH
app.get("/", (req, res) => {
  res.redirect("/signup");
});

// Sign up page
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/views/signup.html");
});

// Register
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const [existingEmail] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const [existingUsername] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUsername.length > 0) {
      return res.status(400).json({ message: "Username already in use" });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hash]
    );

    // res.status(201).json({ message: "User registered" }); // res.redirect("/login");
    res.redirect("/login");
  } catch (err) {
    res.status(500).json({ error: err.message }); // add res.redirect("/signup");  - > // always triggers a GET request
  }
});

app.get("/login", (req, res) => {
  const errorMessage = req.query.error || "";

  let html = fs.readFileSync(__dirname + "/views/login.html", "utf8");

  // Add error message if it exists
  if (errorMessage) {
    const errorHtml = `<div class="signup-form-error">${errorMessage}</div>`;
    html = html.replace(
      '<button type="submit">Login</button>',
      `${errorHtml}\n<button type="submit">Login</button>`
    );
    res.send(html);
  } else {
    res.sendFile(__dirname + "/views/login.html");
  }
});

app.post("/login", async (req, res) => {
  const { usernameEmail, password } = req.body;
  try {
    const [user] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [usernameEmail, usernameEmail]
    );

    if (user.length === 0) {
      return res.redirect("/login?error=Username / Email not found");
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user[0].password_hash
    );
    if (!isValidPassword) {
      return res.redirect("/login?error=Incorrect Password");
    }

    // Set session: // or can use cookies i think
    req.session.userId = user[0].id; // Store user ID in session
    req.session.username = user[0].username; // Store username in session

    // res.status(200).json({ message: "Login successful" });
    res.redirect("/blackjack");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.redirect("/login");
  });
});

// TO GET THE BALANCE OF THE USER
app.get("/api/balance", async (req, res) => {
  if (!req.isLoggedIn)
    return res.status(401).json({ error: "Not authenticated" }); // Go back to login page

  try {
    const [users] = await db.query("SELECT balance FROM users WHERE id = ?", [
      req.session.userId,
    ]);

    if (users.length === 0) req.status(404).json({ error: "User Not Found" });

    res.json({ balance: parseFloat(users[0].balance) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TO UPDATE THE BALANCE OF THE USER
app.post("/api/balance/update", async (req, res) => {
  if (!req.isLoggedIn)
    return res.status(401).json({ error: "Not authenticated" }); // Go back to login page

  const { betAmount, action } = req.body;

  if (!betAmount || !action) {
    return res.status(400).json({ error: "Amount and action are required" });
  }

  try {
    // Start a transaction to ensure data consistency
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get current balance with row locking to prevent race conditions
      const [users] = await connection.query(
        "SELECT balance FROM users WHERE id = ? FOR UPDATE",
        [req.session.userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "User not found" });
      }

      let newBalance = parseFloat(users[0].balance);

      switch (action) {
        case "bet":
          newBalance -= parseFloat(betAmount);
          break;
        case "win":
          newBalance += parseFloat(betAmount) * 2;
          break;
        case "blackjack":
          newBalance += parseFloat(betAmount) * 2.5;
          break;
        case "lose":
          break;
        case "push":
          newBalance += parseFloat(betAmount);
          break;
        default: // NO CHANGE TO DATABASE IF ERROR
          await connection.rollback();
          connection.release();
          return res.status(400).json({ error: "Invalid action" });
      }

      // Update balance in database
      await connection.query("UPDATE users SET balance = ? WHERE id = ?", [
        newBalance,
        req.session.userId,
      ]);

      // Commit the transaction
      await connection.commit();
      connection.release();

      res.json({
        balance: newBalance,
        message: `Balance updated: ${action} $${betAmount}`,
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Money Clicker:

app.post("/api/moneyclicker/click", async (req, res) => {
  if (!req.isLoggedIn)
    return res.status(401).json({ error: "Not authenticated" }); // Go back to login page

  const { item } = req.body;
  let increaseAmount;
  let itemName;
  if (item === "dollar_bill") {
    itemName = "Dollar bill";
    increaseAmount = 1;
  } else {
    itemName = item.name;
    increaseAmount = item.value;
  }
  try {
    // Start a transaction to ensure data consistency
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Get current balance with row locking to prevent race conditions
      const [users] = await connection.query(
        "SELECT balance FROM users WHERE id = ? FOR UPDATE",
        [req.session.userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: "User not found" });
      }

      let newBalance = parseFloat(users[0].balance);

      newBalance += parseFloat(increaseAmount);

      // Update balance in database
      await connection.query("UPDATE users SET balance = ? WHERE id = ?", [
        newBalance,
        req.session.userId,
      ]);

      // Commit the transaction
      await connection.commit();
      connection.release();

      res.json({
        balance: newBalance,
        amount: increaseAmount,
        itemName: itemName,
        message: `Balance updated: click $${increaseAmount}`, // add better features
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// App
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Sign-up: Check availability:
app.get("/api/check-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ available: false });

  try {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
});

app.get("/api/check-username", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.json({ available: false });

  try {
    const [rows] = await db.query("SELECT id FROM users WHERE username = ?", [
      username,
    ]);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    res.status(500).json({ available: false, error: err.message });
  }
});
