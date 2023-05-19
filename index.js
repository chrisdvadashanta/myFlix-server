const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path')
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    uuid = require('uuid');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })

let users = [
    {
        "id": "1",
      "name": "Joe Biden",
      "email": "joe@gmail.com",
      "favoriteMovies": [],
    },
    {
        "id": "2",
      "name": "Hilary Biden",
      "email": "hilary@gmail.com",
      "favoriteMovies": ["Nomadland"] ,
    },
]
let movies = [
    {
      "Title": "Soul",
      "Genre": 
      {
        "Name": "Animation",
        "Description": "Animation is a genre of film that uses techniques like drawings, computer graphics, or stop-motion to create the illusion of movement...",
      },
      "Description": "Soul is a 2020 American computer-animated fantasy comedy-drama film...",
      "Director": {
        "Name": "Pete Docter",
        "Bio": "Pete Docter was born on October 9, 1968, in Bloomington, Minnesota...",
        "Birth": 1968,
        "ImageURL": "https://example.com/pete-docter.jpg"
      },
      "Featured": true
    },
    {
      "Title": "Nomadland",
      "Genre": 
      {
        "Name": "Drama",
        "Description": "Drama is a genre of film that focuses on realistic characters and intense emotional themes. It often explores complex human relationships and societal issues...",
      },      
      "Description": "Nomadland is a 2020 American drama film...",
      "Director": {
        "Name": "Chloé Zhao",
        "Bio": "Chloé Zhao was born on March 31, 1982, in Beijing, China...",
        "Birth": 1982,
        "ImageURL": "https://example.com/chloe-zhao.jpg"
      },
      "Featured": true
    },
    {
      "Title": "Mank",
      "Genre": {
        "Name": "Drama",
        "Description": "Drama is a genre of film that focuses on realistic characters and intense emotional themes. It often explores complex human relationships and societal issues...",
      },      
      "Description": "Mank is a 2020 American biographical drama film...",
      "Director": {
        "Name": "David Fincher",
        "Bio": "David Fincher was born on August 28, 1962, in Denver, Colorado...",
        "Birth": 1962,
        "ImageURL": "https://example.com/david-fincher.jpg"
      },
      "Featured": true
    },
    {
      "Title": "Minari",
      "Genre": {
        "Name": "Drama",
        "Description": "Drama is a genre of film that focuses on realistic characters and intense emotional themes. It often explores complex human relationships and societal issues...",
      },      
      "Description": "Minari is a 2020 American drama film...",
      "Director": {
        "Name": "Lee Isaac Chung",
        "Bio": "Lee Isaac Chung was born on October 19, 1978, in Denver, Colorado...",
        "Birth": 1978,
        "ImageURL": "https://example.com/lee-isaac-chung.jpg"
      },
      "Featured": true
    },
    {
      "Title": "Promising Young Woman",
      "Genre": {
        "Name": "Thriller",
        "Description": "Thriller is a genre of film characterized by suspense, tension, and excitement. It often involves unexpected twists, thrilling plot developments, and keeps the audience on the edge of their seats..."
      },
      "Description": "Promising Young Woman is a 2020 American black comedy thriller film...",
      "Director": {
        "Name": "Emerald Fennell",
        "Bio": "Emerald Fennell was born on October 1, 1985, in Hammersmith, London...",
        "Birth": 1985,
        "ImageURL": "https://example.com/emerald-fennell.jpg"
      },
      "Featured": true
    },
    {
      "Title": "The Trial of the Chicago 7",
      "Genre":  {
        "Name": "Drama",
        "Description": "Drama is a genre of film that focuses on realistic characters and intense emotional themes. It often explores complex human relationships and societal issues...",
      },   
      "Description": "The Trial of the Chicago 7 is a 2020 American legal drama film...",
      "Director": {
        "Name": "Aaron Sorkin",
        "Bio": "Aaron Sorkin was born on June 9, 1961, in New York City, New York...",
        "Birth": 1961,
        "ImageURL": "https://example.com/aaron-sorkin.jpg"
      },
      "Featured": true
    },
]   

app.use(express.static('public'));
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());


app.get("/error/", (req, res, next) => {
    next(new Error("/ is not valid!")); // Pass the error to the error middleware
  });

//1. Gets the list of data about ALL movies
app.get('/movies', (req, res) => {
    res.send(bestMovies);
});

//2. Return data (description, genre, director, image, URL,
//whether it’s featured or not) about a single movie by title to the user
app.get('/movies/:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.Title === title);

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('no such movie');
    }
});

  

//3. Return data about a director (bio, birth year, death year) by name
app.get ('/movies/directors/:directorName', (req, res) => {
    const { directorName } = req.params;
    const director = movies. find( movie => movie.Director.Name === directorName ).Director;
    if (director){
        res.status (200).json (director);
    } else {
    res.status (400).send("no such Director");
    }
});

  

//4. Return data about a genre (description) by name/title (e.g., “Thriller”)
app.get ('/movies/genre/:genreName', (req, res) => {
    const { genreName } = req.params;
    const genre = movies. find( movie => movie.Genre.Name === genreName ).Genre;
    if (genre){
        res.status (200).json (genre);
    } else {
    res.status (400).send("no such genre");
    }
});


//5. Allow new users to register
app.post('/users', (req, res) => {
    let newUser = req.body;
  
    if (!newUser.name) {
      const message = 'Missing name in request body';
      res.status(400).send(message);
    } else {
      newUser.id = uuid.v4();
      users.push(newUser);
      res.status(201).json(newUser);
    }
  });
  

//6. Allow users to update their user info (username)
app.put('/users/:id', (req, res) => {
    const { id  } = req.params;
    let updatedUser = req.body;
    
    let user = users.find(user => user.id == id); //using two = bc the URL is a string and compare thruthyness

    if (user){
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('no such user'); 
    }
  
  });

//7. Allow users to add a movie to their list of favorites
//   (showing only a text that a movie has been added—more on this later)
app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle  } = req.params;
    
    let user = users.find(user => user.id == id); //using two = bc the URL is a string and compare thruthyness

    if (user){
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to ${id} favorites`);
    } else {
        res.status(400).send('no such user'); 
    }
  
  });
 

//8. Allow users to remove a movie from their list of favorites
// (showing only a text that a movie has been removed—more on this later)
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle  } = req.params;
    
    let user = users.find(user => user.id == id); //using two = bc the URL is a string and compare thruthyness

    if (user){
        user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle )
        res.status(200).send(`${movieTitle} has been removed from ${id} favorites`);
    } else {
        res.status(400).send('no such user'); 
    }
  
  });

//9. Allow existing users to deregister (showing only a text
// that a user email has been removed—more on this later)
app.delete('/users/:id/', (req, res) => {
    const { id } = req.params;
    
    let user = users.find(user => user.id == id); //using two = bc the URL is a string and compare thruthyness

    if (user){
        users = users.filter( user => user.id != id )
        res.status(200).send(`User ${id} has been deleted`);
    } else {
        res.status(400).send('no such user'); 
    }
  
  });
  
app.get('/', (req, res) => {
    res.send('This is my default text!');
});


app.use((err, req, res, next) => {
    console.log("Error happened", err); 
    res.status(500).send('Internal Server Error');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});