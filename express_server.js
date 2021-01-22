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
  const user = users[req.session.userID];
  if (!user) {
    return res.redirect("/login");
  }
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.userID, urlDatabase),
    user: users[req.session.userID],
  };
  if (!templateVars.user) {
    const errorMessage = "Error - You must log in to view this page";
    return res.render("error", { errorMessage });
  }
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
  if (templateVars.user) {
    return res.redirect('/urls');
  }
  res.render("login", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.userID] };
  if (!templateVars.user) {
    return res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    const errorMessage = "Error - Page not found";
    return res.render("error", { errorMessage });
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    urlUserID: urlDatabase[req.params.shortURL].userID,
    user: users[req.session.userID]
  };
  if (!templateVars.user) {
    const errorMessage = "Error - Log in to view your urls";
    return res.render("error", { errorMessage });
  }
  if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    const errorMessage = "Error - Unauthorized";
    return res.render("error", { errorMessage });
  }
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get('*', (req, res) => {
  const errorMessage = "Error - Page Not Found";
  return res.render("error", { errorMessage });
});

app.post("/register", (req, res) => {
  if (!req.body.password || !req.body.email) {
    const errorMessage = "Error - Username and password cannot be blank";
    return res.render("error", { errorMessage });
  }
  if (getUserByEmail(req.body.email, users)) {
    const errorMessage = "Error - An account already exists for this email. Please log in to continue";
    return res.render("error", { errorMessage });
  }
  const id = generateRandomString();
  const password = bcrypt.hashSync(req.body.password, 10);
  users[id] = { id: id, email: req.body.email, password: password};
  console.log(users);
  req.session.userID = users[id].id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    const errorMessage = "Error - Unauthorized";
    return res.render("error", { errorMessage });
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID !== req.session.userID) {
    const errorMessage = "Error - Unauthorized";
    return res.render("error", { errorMessage });
  }
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const user = users[req.session.userID];
  if (!user) {
    const errorMessage = "Error - Unauthorized";
    return res.render("error", { errorMessage });
  }
  const key = generateRandomString();
  urlDatabase[key] = { longURL: req.body.longURL, userID: req.session.userID };
  res.redirect(`/urls/${key}`);
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
    const errorMessage = "Error - Unable to log in. Username or password is incorrect";
    return res.render("error", { errorMessage });
  }
  req.session.userID = user.id;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});