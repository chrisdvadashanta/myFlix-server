const mongoose = require('mongoose');
//////hashing///
const bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema({
    Title:{type:String, required:true },
    Description:{type:String, required: true},
    Genre:{
        Name:String,
        Description: String
    },
    Director:{
        Name: String,
        Bio: String,
        Birthyear: Date,
        Deathyear: Date
    },
    Actors:[String],
    ImagePath:String,
    Featured: Boolean
});

let userSchema = mongoose.Schema({
    username:{type:String, required:true},
    password:{type:String, required:true},
    email:{type:String, require:true},
    birthday: Date,
    favorites:[{type:mongoose.Schema.Types.ObjectId, ref:'Movie'}]
});

//////bcrypt password hashing///////
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
  };
  userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };


let Movie = mongoose.model('Movie',movieSchema);
let Users = mongoose.model ( 'User',userSchema);

module.exports.Movie = Movie;
module.exports.Users = Users;
