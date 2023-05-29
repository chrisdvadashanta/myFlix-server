const express = require('express'),
  morgan = require('morgan'),
  fs = require('fs'),
  path = require('path')
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  uuid = require('uuid');

//////////// MONGOOSE Integration ////////////////    
const mongoose = require('mongoose');
const Models = require('./models');

const Movies = Models.Movie;
const Users = Models.Users;

mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

/////// EXPRESS ///////
const app = express();
app.use(bodyParser.urlencoded({ extended: true })),
app.use(bodyParser.json());

//////////// Authentication ///////////
let auth = require('./auth')(app);
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
app.get('/movies/:title', (req, res) => {
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
app.get('/movies/directors/:directorName', (req, res) => {
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
app.get(
  '/movies/genres/:genreName',  (req, res) => {
    Movies.find({ 'Genre.Name': req.params.genreName })
      .then((movies) => {
        res.status(200).json(movies);
      })
      .catch((err) => {
        res.status(500).send('Error: ' + err);
      });
  }
);



/////////// 5. Allow new users to register 
app.post('/users', (req, res) => {
  Users.findOne({ Username: req.body.Username })
    .then((users) => {
      if (users) {
        return res.status(400).send(req.body.Username + ' already exists');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((users) => { res.status(200).json(users) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

//5a. Get a user by name
app.get('/users/:Username', (req, res) => {
  Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});


//6. Allow users to update their user info (username)
app.put('/users/:Username', (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $set: {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    { new: true }
  )
    .then(updatedUser => {
      res.json(updatedUser);
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

//7. Allow users to add a movie to their list of favorites 
//   (showing only a text that a movie has been added—more on this later)
app.post('/users/:Username/movies/:MovieID', (req, res) => {
  Users.findOneAndUpdate({ Username: req.params.Username }, {
    $push: { FavoriteMovies: req.params.MovieID }
  },
    { new: true }, // This line makes sure that the updated document is returned

    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
      } else {
        res.json(updatedUser);
      }
    });
});

//8. Allow users to remove a movie from their list of favorites

app.delete('/users/:id/:movieTitle', async (req, res) => {
  const { id, movieTitle } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $pull: { favoriteMovies: movieTitle } },
      { new: true }
    );

    if (user) {
      res.status(200).send(`${movieTitle} has been removed from ${id} favorites`);
    } else {
      res.status(400).send('No such user');
    }
  } catch (error) {
    res.status(500).send('An error occurred');
  }
});


//9. Allow existing users to deregister (showing only a text
// that a user email has been removed—more on this later)
app.delete('/users/:Username', (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((users) => {
      if (!users) {
        res.status(400).send(req.params.Username + ' was not found');
      } else {
        res.status(200).send(req.params.Username + ' was deleted.');
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

app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});