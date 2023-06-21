const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path')
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  uuid = require('uuid');
  
const { check, validationResult } = require('express-validator');

//////////// MONGOOSE Integration ////////////////    
const mongoose = require('mongoose');
const Models = require('./models');

const Movies = Models.Movie;
const Users = Models.Users;

mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
////////////Local testing Code /////////////
// mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });


/////// EXPRESS ///////
const app = express();

//////Corse///////
const cors = require('cors');
app.use(cors());

/*
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback (null,true);
    if (allowedOrigins.indexOf(origin) === -1){
      let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
    return callback(null, true);
  }
}))
*/

////// Body Parser///////
app.use(bodyParser.urlencoded({ extended: true })),
app.use(bodyParser.json());

//////////// Authentication ///////////
require('./auth')(app);
const passport = require('passport');
const { errorMonitor } = require('events');
require('./passport');

app.use(express.static('public'));
app.use(methodOverride());

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }));

////////ERROR HANDLING ////////
app.get("/error/", (req, res, next) => {
  next(new Error("/ is not valid!")); // Pass the error to the error middleware
});

/////////Data about Movies/////////////

///////// 1. Gets the list of data about ALL movies 
app.get('/movies', (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(200).send(res.json(movies));
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});


//////// 2. Return data (description, genre, director, image, URL, 
//whether it’s featured or not) about a single movie by title to the user
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.title })
    .then((movies) => {
      if (movies) {
        res.json(movies);
        console.log('movie passed')
      } else {
        res.status(404).send('Movie not found');
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//////// 3. Return data about a director (bio, birth year, death year) by name
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }),      (req, res) => {
  Movies.findOne({ 'Director.Name': req.params.directorName })
    .then(movie => {
      if (movie) {
        res.json(movie.Director);
      } else {
        res.status(404).send('No movie found for the specified director');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

///////// 4. Return data about a genre (description) by name/title (e.g., “Thriller”)  
app.get( '/movies/genre/:genreName',  passport.authenticate('jwt', { session: false }),      (req, res) => {
    Movies.find({ 'Genre.Name': req.params.genreName })
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        res.status(500).send('Error: ' + err);
      });
  }
);

////////////Users///////////////

/////////// 5. Allow new users to register 
app.post('/users',
[
  check('username', 'username is required').isLength({min: 5}),
  check('username', 'username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('password', 'password is required').not().isEmpty(),      // Validation logic: chain of methods{ .not().isEmpty() } =>"opposite of isEmpty" (is not empty)
  check('email', 'email does not appear to be valid').isEmail()
], 
(req, res) => {
// checks the validation object for errors
  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.password);  ////hashing password
  Users.findOne({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.status(400).send(req.body.username + ' already exists');
      } else {
        Users.create({
            username: req.body.username,
            password: hashedPassword,         /////hashing Password
            email: req.body.email,
            birthday: req.body.birthday
          })
          .then((createdUser) => {
            res.status(200).json(createdUser);
          })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

/////////// 6. Allow users to update their user info (username)
app.put('/users/:username',  passport.authenticate('jwt', { session: false }),    (req, res) => {
  Users.findOneAndUpdate(
    { username: req.params.username },
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        birthday: req.body.birthday
      }
    },
    { new: true }
  )
    .then((updatedUser) => {
      console.log(updatedUser);
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

////////////////// 7. Allow users to add a movie to their list of favorites 
app.post('/users/:username/movies/:Title', passport.authenticate('jwt', { session: false }),     async (req, res) => {
  const movieTitle = req.params.Title
  const movie = await Movies.findOne({Title: movieTitle});

  console.log("movies", movie._id);

  let newUser = await Users.findOneAndUpdate({ username: req.params.username }, {
    $push: { Favorites: movie._id }
  },
    { new: true }, // This line makes sure that the updated document is returned
  );
    return res.json(newUser);
});


////////////////// 8. Allow users to remove a movie from their list of favorites

app.delete('/users/:username/movies/:movieTitle', passport.authenticate('jwt', { session: false }),     async (req, res) => {
  const {username, movieTitle } = req.params;
  
  try {
    const user = await Users.findOneAndUpdate({ username: req.params.username },
      { $pull: { Favorites: movieTitle } },
      { new: true }
    );

    if (user) {
      res.status(200).send(`${movieTitle} has been removed from ${username} favorites`);
    } else {
      res.status(400).send('No such user');
    }
  } catch (error) {
    console.error("error", error)
    res.status(500).send('An error occurred');
  }
});


/////////// 9. Allow existing users to deregister 
app.delete('/users/:username', passport.authenticate('jwt', { session: false }),     (req, res) => {
  Users.findOneAndRemove({ username: req.params.username })
    .then((users) => {
      if (!users) {
        res.status(400).send(req.params.username + ' was not found');
      } else {
        res.status(200).send(req.params.username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

app.get('/', (req, res) => {
  res.send('Welcome to myFlix app');
});

app.use((err, req, res, next) => {
  console.log("Error happened", err);
  res.status(500).send('Internal Server Error');
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0',() => {
 console.log('Listening on Port ' + port);
});