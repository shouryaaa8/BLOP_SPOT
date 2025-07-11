const express = require('express');
const app=express();
const userModel=require("./models/user");
const postModel=require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { mongo } = require('mongoose');
const path= require('path');
const upload= require("./config/multerconfig");
require('dotenv').config();

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"public")));

app.get("/", function(req,res){
    res.render("index");
})

app.post("/register", async function(req,res){
    let {name,username,age,email,password}=req.body;
    
    let user= await userModel.findOne({email});
    if(user) return res.status(500).send("User already exists");

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
            let user = await userModel.create({
                username,
                name,
                age,
                email,
                password:hash
            });

            let token= jwt.sign({email: email, userid: user._id}, "secret");
            res.cookie("token", token);
            res.send("User registered successfully");
        });
    });
})

app.get("/login", async function(req,res){
    res.render("login");
})

app.get("/profile", isloggedIn, async function(req,res){
    let user= await userModel.findOne({email: req.user.email}).populate("posts");
    
    res.render("profile",{user});
})

app.get("/profile/upload", isloggedIn, function(req,res){
    res.render("profileupload")
})

app.post("/upload", isloggedIn, upload.single("image"), async function(req,res){
    let user= await userModel.findOne({email: req.user.email});
    user.profilepic= req.file.filename;
    await user.save();
    res.redirect("/profile");
})

app.get("/edit/:id", isloggedIn, async function(req,res){
    let post= await postModel.findOne({_id: req.params.id}).populate("user");
    
    res.render("edit",{post});
})

app.get("/like/:id", isloggedIn, async function(req,res){
    let post= await postModel.findOne({_id: req.params.id}).populate("user");
    
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    
    await post.save();
    res.redirect("/profile");
})

app.post("/update/:id", isloggedIn, async function(req,res){
    let post= await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content}).populate("user");
    res.redirect("/profile");
})

app.post("/post", isloggedIn, async function(req,res){
    let user= await userModel.findOne({email: req.user.email});
    let {content}=req.body;
    let post= await postModel.create({
        user:user._id,
        content,
    })

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

app.post("/login", async function(req,res){
    let {email,password}=req.body;
    
    let user= await userModel.findOne({email});
    if(!user) return res.status(500).send("something went wrong");

    bcrypt.compare(password, user.password, function(err, result) {
        if(result){
            let token= jwt.sign({email: email, userid: user._id}, "secret");
            res.cookie("token", token); 
            return res.status(500).send("you can login");
        }
        else res.redirect("/login");
    });
})

app.get("/logout", async function(req,res){
    res.cookie("token","");
    res.redirect("/login"); 
})

function isloggedIn(req,res,next){
    if(req.cookies.token==="") return res.status(500).send("you must be logged in"); 
    else{
        let data= jwt.verify(req.cookies.token,"secret");
        req.user=data;
    }
    next();
}

app.listen(3000);
