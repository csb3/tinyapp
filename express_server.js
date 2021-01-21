const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers');

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'userID',
  keys: ['key1', 'key2']
}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$1RXPF4PqE8Jc7Uy8jS4XuOKgbR28NTFJJtoC/DpCHtuKBFc/ODpcm"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$/ptMy/GGzKieuervKg8WouPifTXCdxwYcdHjHu45Ezo0lJsHtoImG"
  }
};

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": { longURL: "http://google.com", userID: "user2RandomID" }
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.userID, urlDatabase),
    user: users[req.session.userID],
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.userID]
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.userID]
  };
  res.render("login", templateVars);
});

app.post("/register", (req, res) => {
  if (!req.body.password || !req.body.email || getUserByEmail(req.body.email, users)) {
    res.status(400).send("User could not be registered");
  } else {
    const id = generateRandomString();
    const password = bcrypt.hashSync(req.body.password, 10);
    users[id] = { id: id, email: req.body.email, password: password};
    console.log(users);
    req.session.userID = users[id].id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.userID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(401).send("401 - Unauthorized");
  }
});

app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.userID) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  } else {
    res.status(401).send("401 - Unauthorized");
  }
});

app.post("/urls", (req, res) => {
  const key = generateRandomString();
  urlDatabase[key] = { longURL: req.body.longURL, userID: req.session.userID};
  res.redirect(`/urls/${key}`);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.userID] };
  if (!templateVars.user) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    urlUserID: urlDatabase[req.params.shortURL].userID,
    user: users[req.session.userID]
  };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userID = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Unable to log in");
  }
});