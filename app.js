//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// $ npm i passport passport-local passport-local-mongoose express-session
const session = require("express-session");  //Level 5
const passport = require("passport"); //Level 5
const passportLocalMongoose = require("passport-local-mongoose"); //Level 5
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

/////////lEVEL-5 Passport and Cookies /////////

app.use(session({      //Level 5
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());  //Level 5
app.use(passport.session());     //Level 5

const userSchema = new mongoose.Schema({ //Object created from object Schema class
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);  //Level 5


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/logout", function(req , res){
  //Method from passport local mongoose package
  req.logout();
  res.redirect("/");
});

app.get("/secrets",function(req , res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

app.post("/register",function(req , res){
  //Method from passport local mongoose package
  User.register({username:req.body.username},req.body.password, function(err , user){
    if(err){
      console.log(err);
      res.redirect("/register")
    }else{
      passport.authenticate("local")(req , res , function(){
        res.redirect("/secrets");
      });
    }
  })
});

app.post("/login",function(req , res){
  const user = new User({
    username : req.body.username,
    password : req.body.password
  });

  //Method from passport local mongoose package
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req , res , function(){
        res.redirect("/secrets");
      })
    }
  })
});




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
