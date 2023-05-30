const mongoose = require('mongoose');

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
    Username:{type:String, required:true},
    Password:{type:String, required:true},
    Email:{type:String, require:true},
    Brithday: Date,
    FavoriteMovies:[{type:mongoose.Schema.Types.ObjectId, ref:'Movie'}]
});

let Movie = mongoose.model('Movie',movieSchema);
let Users = mongoose.model ( 'User',userSchema);

module.exports.Movie = Movie;
module.exports.Users = Users;
