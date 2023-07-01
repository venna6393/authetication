const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
let db = null;
const install = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("applications is running on server 3001");
    });
  } catch (e) {
    console.log("error occur");
    process.exit(1);
  }
};
install();
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `SELECT * FROM user WHERE username='${username}'`;
  let result = await db.get(query);
  if (result !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const q1 = `INSERT INTO user (username,name,password,gender,location)
            VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
      await db.run(q1);
      response.status(200);
      response.send("User created successfully");
    }
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query = `SELECT * FROM user WHERE username='${username}'`;
  let result = await db.get(query);
  console.log(result);
  if (result === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    console.log(password);
    const bool = await bcrypt.compare(password, result.password);
    console.log(bool);
    if (bool === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  let query = `SELECT * FROM user WHERE username = '${username}'`;
  let newBcryptPassword = await bcrypt.hash(newPassword, 10);
  const result = await db.get(query);
  if (result === undefined) {
    response.status(400);
  } else {
    const bool = await bcrypt.compare(oldPassword, result.password);
    if (bool === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        let q1 = `UPDATE user SET password = '${newBcryptPassword}'`;
        await db.run(q1);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
