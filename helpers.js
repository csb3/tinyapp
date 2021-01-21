const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (email === database[user]["email"]) {
      return database[user];
    }
  }
};

const urlsForUser = function(id, database) {
  const urls = {};
  for (const url in database) {
    if (database[url]["userID"] === id) {
      urls[url] = database[url];
    }
  }
  return urls;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser};