const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const dotenv = require("dotenv");
dotenv.config();
var cors = require("cors");
const session = require("express-session");
const store = new session.MemoryStore();
const UserRouter = require("./Routes/Users.js");
const CableRouter = require("./Routes/Cables");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const LocalStrategy = require("passport-local").Strategy;
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
app.use(cookieParser());
app.use(
  session({
    secret: "somesecret",
    cookie: { maxAge: 4000000 },
    saveUninitialized: false,
    resave: false,
    store,
  })
);
console.log(
  process.env.USER + process.env.CONNECTSTRING + process.env.PASSWORD
);
//connect to oracle db
const oracledb = require("oracledb");
// try {
//   oracledb.initOracleClient();
// } catch (err) {
//   console.error(err);
//   process.exit(1);
// }
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
const conDetails = {
  user: process.env.USER.toString(),
  password: process.env.PASSWORD.toString(),
  connectString: process.env.CONNECTSTRING.toString(),
  events: true,
};

passport.serializeUser((user, done) => {
  done(null, user.USERNAME);
});
passport.deserializeUser(async (username, done) => {
  console.log("DESERIALIZE");
  let db;
  try {
    db = await oracledb.getConnection(conDetails);

    const result = await db.execute(
      `SELECT * FROM SMARTCAPTAR_USERS WHERE USERNAME = '${username}'`
    );

    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    }
  } catch (err) {
    done(err, null);
  }

  if (db) {
    try {
      await db.close();
    } catch (err) {
      console.error(err);
    }
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    console.log(username + password);
    let db;
    try {
      db = await oracledb.getConnection(conDetails);

      const result = await db.execute(
        `SELECT * FROM SMARTCAPTAR_USERS WHERE USERNAME = '${username}'`
      );

      if (result.rows.length > 0) {
        done(null, result.rows[0]);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err, null);
    }

    if (db) {
      try {
        await db.close();
      } catch (err) {
        console.error(err);
      }
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  req.db = oracledb;
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) {
    console.log("USER:");
    console.log(req.user);
  } else {
    console.log("NO");
  }
  req.conDetails = conDetails;

  console.log(`${req.method} - ${req.url}`);
  return next();
});

app.use("/", UserRouter);
app.use("/", CableRouter);
app.post("/login", cors(), passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});
app.post("/logout", cors(), (req, res) => {
  console.log("YEET");
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
  });
  res.send(200);
  console.log(req.isAuthenticated());
});

app.post("/test", async (req, res) => {
  //New variable for cables taht are being sent

  res.json({ msg: "SUCCESS" });
});

// Starting Web Server
async function ws() {
  server.listen(1337, function () {
    console.log("Listening on http://localhost:" + 1337);
  });
}

//Runs when npm start
async function run() {
  await ws();
}

run();
