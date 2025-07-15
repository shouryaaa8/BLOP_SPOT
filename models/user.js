const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = mongoose.Schema({
    name:String,
    username:String,
    age:Number,
    email:String,
    password:String,
    profilepic: {
        type: String,
        default: "default.webp"
    },
    posts:[{ type:mongoose.Schema.Types.ObjectId, ref:"post"}],
});

module.exports=mongoose.model("user",userSchema);