const express = require("express");
const app = express();
const port = 3001;
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const saltRounds = 12;
const jwt = require("jsonwebtoken");
const secret = "loginsecret";

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "xxx",
  database: "mymine",
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//////// login and register ////////

app.post("/register", (req, res) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log(err);
    }

    db.query(
      "INSERT INTO user (email, username, password) VALUES (?, ?, ?)",
      [email, username, hash],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send("Values Inserted");
        }
      }
    );
  });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query("SELECT * FROM user WHERE email = ?", email, (err, result) => {
    if (err) {
      res.send({ err: err });
      return;
    }

    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (error, response) => {
        if (error) {
          res.send({ error: error });
          return;
        }

        if (response) {
          const id = result[0].id;
          const username = result[0].username;
          const token = jwt.sign({ id }, secret, {
            expiresIn: "5h",
          });
          res.json({ auth: true, token: token, username: username });
        } else {
          res.json({ auth: false, message: "Wrong username/password" });
        }
      });
    } else {
      res.json({ auth: false, message: "No user found" });
    }
  });
});

app.post("/isUserAuth", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ auth: false, message: "No token provided" });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ auth: false, message: "Failed to authenticate token" });
    }

    // Optionally, you can add more checks here (e.g., checking the user in the database)
    res.json({ auth: true, decoded });
  });
});

//////// calendar data ////////

app.get("/getCalendar/:user", (req, res) => {
  const username = req.params.user; // Change from req.query.user to req.params.user
  db.query(
    "SELECT id_login FROM user WHERE username = ?",
    [username],
    (err, userResult) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Server error");
      }
      if (userResult.length === 0) {
        console.log("No user found with username:", username);
        return res.status(404).send("User not found");
      } else {
        const id_login = userResult[0].id_login;
        db.query(
          "SELECT * FROM calendar WHERE user = ? AND status = 1",
          [id_login],
          (err, calendarResult) => {
            if (err) {
              console.log(err);
              return res.status(500).send("Server error");
            }
            res.send(calendarResult);
          }
        );
      }
    }
  );
});

app.post("/addCalendar", (req, res) => {
  const user = req.body.user;
  const title = req.body.title;
  const content = req.body.content;
  const start_time = req.body.start_time;
  const end_time = req.body.end_time;

  db.query(
    "SELECT id_login FROM user WHERE username = ?",
    [user],
    (err, userResult) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Server error");
      } else {
        const id_login = userResult[0].id_login;
        db.query(
          "INSERT INTO calendar (user , title, content, start_time, end_time) VALUES (?, ?, ?, ?, ?)",
          [id_login, title, content, start_time, end_time],
          (err, result) => {
            if (err) {
              console.log(err);
              return res
                .status(500)
                .send("An error occurred while adding the calendar.");
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});

app.post("/updateCalendar", (req, res) => {
  const { id_calendar, title, content, start_time, end_time } = req.body;

  db.query(
    "UPDATE calendar SET title = ?, content = ?, start_time = ?, end_time = ? WHERE id_calendar = ?",
    [title, content, start_time, end_time, id_calendar],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred while updating the calendar.");
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/deleteCalendar", (req, res) => {
  const id_calendar = req.body.id_calendar;

  db.query(
    "UPDATE calendar SET status = 0 WHERE id_calendar = ?",
    id_calendar,
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred while deleting the calendar.");
      } else {
        res.send(result);
      }
    }
  );
});

//////// blog data ////////

app.get("/getDiary/:user", (req, res) => {
  const username = req.params.user; // Change from req.query.user to req.params.user
  db.query(
    "SELECT id_login FROM user WHERE username = ?",
    [username],
    (err, userResult) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Server error");
      }
      if (userResult.length === 0) {
        console.log("No user found with username:", username);
        return res.status(404).send("User not found");
      } else {
        const id_login = userResult[0].id_login;
        db.query(
          "SELECT * FROM diary WHERE user = ? AND status = 1",
          [id_login],
          (err, diaryResult) => {
            if (err) {
              console.log(err);
              return res.status(500).send("Server error");
            }
            res.send(diaryResult);
          }
        );
      }
    }
  );
});

app.post("/addDiary", (req, res) => {
  const user = req.body.user;
  const title = req.body.title;
  const content = req.body.content;
  const created_at = req.body.created_at;

  db.query(
    "SELECT id_login FROM user WHERE username = ?",
    [user],
    (err, userResult) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Server error");
      } else {
        const id_login = userResult[0].id_login;
        db.query(
          "INSERT INTO diary (user , title, content, created_at) VALUES (?, ?, ?, ?)",
          [id_login, title, content, created_at],
          (err, result) => {
            if (err) {
              console.log(err);
              return res
                .status(500)
                .send("An error occurred while adding the diary.");
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});
