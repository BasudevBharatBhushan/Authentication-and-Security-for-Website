//jshint esversion:6
require("dotenv").config();                //npm i dotenv
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session"); //Level 5
const passport = require("passport"); //Level 5
const passportLocalMongoose = require("passport-local-mongoose"); //Level 5
const GoogleStrategy = require("passport-google-oauth20").Strategy; //level-6
const findOrCreate = require('mongoose-find-or-create'); //level-6


const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

app.use(session({ //Level 5
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize()); //Level 5
app.use(passport.session()); //Level 5

/////////////////////////////LEVEL-6 OAuth Google///////////////////////////////////

const userSchema = new mongoose.Schema({ //Object created from object Schema class
  email: String,
  password: String,
  googleId: String, //Level - 6 Google Auth
  secret:String
});

userSchema.plugin(passportLocalMongoose); //Level 5
userSchema.plugin(findOrCreate); //Level 6   method of mongoose-find-or-create


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) { //method from passport package which will work with anykind of authentication  Level-6
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({ //Level - 6 google oauth
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) { //Method of mongoose-find-or-create
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/auth/google", //level 6
  passport.authenticate("google", {
    scope: ["profile"]
  })
);

app.get("/auth/google/secrets", //level 6   //google redirect to this page
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/logout", function(req, res) {
  //Method from passport local mongoose package
  req.logout();
  res.redirect("/");
});

app.get("/secrets", function(req, res) {
  User.find({"secret":{$ne:null}},function(err , foundUsers){
    if(err){
      console.log();
    }else{
      if(foundUsers){
        res.render("secrets",{userWithSecrets:foundUsers});
      }
    }
  });
});

app.get("/submit",function(req , res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});


app.post("/register", function(req, res) {
  //Method from passport local mongoose package
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register")
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  })
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  //Method from passport local mongoose package
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      })
    }
  })
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
