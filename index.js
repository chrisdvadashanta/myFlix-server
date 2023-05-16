const express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    path = require('path')
    bodyParser = require('body-parser'),
    methodOverride = require('method-override');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })

let bestMovies = [
    {
        "title": "The Godfather",
        "director": "Francis Ford Coppola"
    },
    {
        "title": "Citizen Kane",
        "director": "Orson Welles"
    },
    {
        "title": "Pulp Fiction",
        "director": "Quentin Tarantino"
    },
    {
        "title": "The Shawshank Redemption",
        "director": "Frank Darabont"
    },
    {
        "title": "The Dark Knight",
        "director": "Christopher Nolan"
    },
    {
        "title": "Schindler's List",
        "director": "Steven Spielberg"
    },
    {
        "title": "The Lord of the Rings: The Fellowship of the Ring",
        "director": "Peter Jackson"
    },
    {
        "title": "Seven Samurai",
        "director": "Akira Kurosawa"
    },
    {
        "title": "The Good, the Bad and the Ugly",
        "director": "Sergio Leone"
    },
    {
        "title": "Inception",
        "director": "Christopher Nolan"
    }
]

app.use(express.static('public'));
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(methodOverride());

app.use((err, req, res, next) => {
    // logic
});

app.get("/", (req, res) => {
  throw new Error("/ is not valid!");
});


app.get('/movies', (req, res) => {
    res.send(bestMovies);
});


app.get('/', (req, res) => {
    res.send('This is my default text!');
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8000.');
});
