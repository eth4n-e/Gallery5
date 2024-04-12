// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************


const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

//ask about how to get .env variables when in different directory

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here

// *****************************************************
// <!               Login - Amy                   >
// *****************************************************
const user = {
    username: undefined,
    password: undefined,
  };

  app.get('/login', (req, res) => {
    res.render('pages/login');
  });
  
  app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  //console.log(username, password);

    try {
        // Find the user from the database
        const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
        
        if (user) {
          // Check if the entered password matches the stored hashed password
          
          const passwordMatch = await bcrypt.compare(password, user.password);
    
          if (passwordMatch) {
            // Save the user in the session variable
            req.session.user = user;
            req.session.save();
    
            // Redirect to /discover route after setting the session
            res.redirect('/discover');
          } else {
            // Incorrect username or password, render login page with error message
            message = `Incorrect username or password.`
            res.render('pages/login', { message });
          }
        } else {
          // User not found in the table
          message = 'User not found! Please check spelling or click below to register.'
          res.render('pages/login', { message });
        }
      } catch (error) {
        console.error(error);
        // Database request fails, send an appropriate message to the user and render the login.hbs page
        message ='An error occurred during login. Please try again.'
        res.render('pages/login', { message });
      }
});


// *****************************************************
// <!               Register - Amy                  >
// *****************************************************
app.get('/register', (req, res) => {
    res.render('pages/register');
  });
  
  app.post('/register', async (req, res) => {
   // console.log("test");
    try {
      const usernameLocal = req.body.username;
      const hash = await bcrypt.hash(req.body.password, 10);
      const email = req.body.email;
  
      // Check if the username already exists in the database
      const userExists = await db.oneOrNone('SELECT username FROM users WHERE username = $1', [usernameLocal]);
      if(!usernameLocal ||!req.body.password){ //if user empty or pass empty
          throw new Error('Username or password is empty');

      }
      if (userExists) {
        // Username already exists, redirect to register page with error message
        throw new Error('Username already exists');
        
        
      }
  
      // Register the user with the provided data
      await db.none('INSERT INTO users(username, password, email) VALUES($1, $2, $3)', [usernameLocal, hash, email]);
     
      //at this point we need to redirect to  login, cause registration was successful. 
      //In order to get unit tests to work, we need to send a redirect, not a render.
      //the problem is, that redirect takes one paramater, so we cnanot send it the mssage.
      //Maybe once we set the session we could do something like:

       //res.session.message = 'Success! Please login with new credentials: '

       //until then,
      res.redirect('/login');  

     // res.render('pages/login', { message: 'Success! Please login with new credentials: ' });
      } catch (error) {

      console.error(error);
      // Handle errors gracefully (e.g., display error message)
      //now alternatively, instead of testing for redirects, we could test for certain keywords in the HTML response.
      //in this case, instead of redurecting to register, we can simply render the page, and in the test check that we rendered the page with <title>Register<title>.
      res.status(400).render('pages/register', { message: 'An error occurred during registration. Please try again.' });
      
     
    }
  });
  
  
// *****************************************************
// <!     Authentication Middleware                   >
// *****************************************************
  //Authentication Middleware
  const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to login page if not authenticated
      return res.redirect('/login');
    }
    next(); // Allow access if authenticated
  };
  
  app.use(auth);


  
// *****************************************************
// <!          Artworks-Ethan                  >
// *****************************************************

// Note: we have const axios above already.


app.get('/artwork', async (req, res) => {
  try {
    const response = await axios({
      url: 'https://api.artsy.net/api/artworks',
      method: 'GET',
      headers: {
        'X-XAPP-Token': process.env.X_XAPP_TOKEN
      }
    }) 

    /* format of response 
    {
      _embedded {
        artworks: [
          list of artworks
        ]
    */
    

    const artworks = response.data._embedded.artworks;

    res.render('pages/artworks', artworks);

  } catch(error) {
    console.log(error);

    res.redirect('/register');

  }
})







// *****************************************************
// <!          Home / Discover-Ethan                  >
// *****************************************************

function getEvents() {
  //axios.get(url, config *e.g headers and such*)
  const config = {
    headers: {
      'X-XAPP-Token': process.env.X_XAPP_TOKEN
    },
    params: {
      status: 'running_and_upcoming'
    }
  };

  return axios.get('https://api.artsy.net/api/fairs', config)
    .catch(err => {
      console.log(err);
    });
}

// handle artworks api call
function getArtworks() {
  const config = {
    headers: {
      'X-XAPP-Token': process.env.X_XAPP_TOKEN
    }
  }
  //axios.get(url, config *e.g headers and such*)
  return axios.get('https://api.artsy.net/api/artworks', config)
    .catch(err => {
      console.log(err);
    });
}

// handle artists api call
function getArtists() {
  const config = {
    headers: {
      'X-XAPP-Token': process.env.X_XAPP_TOKEN
    },
    params: {
      artworks: true,
      sort: '-trending'
    }
  };
  //axios.get(url, config *e.g headers and such*)
  return axios.get('https://api.artsy.net/api/artists', config)
    .catch(err => {
      console.log(err);
    })
}

app.get('/discover', async (req, res) => {
try {
  // when successful, Promise.all returns an array of the fulfilled promises (responses is an array)
  const [eventsRes, artworksRes, artistsRes] = await Promise.all([getEvents(), getArtworks(), getArtists()]); 

  const events = eventsRes.data._embedded.fairs;
  const artworks = artworksRes.data._embedded.artworks;
  const artists = artistsRes.data._embedded.artists;

  // Give to discover.hbs
  // ask about passing multiple fulfilled promises
  res.render('pages/discover', { events, artworks, artists });
} catch (error) {
  console.error(error);

  // If the API call fails, render pages/discover with an empty results array and the error message
  res.render('pages/discover', { results: [], message: 'An error occurred while fetching data from the Artsy API.' });
}
});

// *****************************************************
// <!               Events - Khizar                   >
// *****************************************************
app.get('/events', (req, res) => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  res.render('./pages/events',{API_KEY});
});


// *****************************************************
// <!               Profile- Catherine                 >
// *****************************************************


// *****************************************************
// <!       Artist / Collection -Austin                >
// *****************************************************


/* Upon reaching the artists page, the page will display a list of all artists. If a search was used, the artist page will first
    display the artist, followed by two subsections related artwork and related artists (using Artsy's similarity)

  FOOM:
  1. Check for keyword
    a) if NO Key word then display page of artists using artsy search
    b) if keyword, query artsy for the keyword.
  2. Upon receiving the keyword, begin querying for Artist information:
      artist name, thumbnail, bio, birth-deathday, etc.
  3. Example Output from Artsy:
        "id": "4d8b92b34eb68a1b2c0003f4",
        "slug": "andy-warhol",
        "created_at": "2010-08-23T14:15:30+00:00",
        "updated_at": "2024-04-10T16:42:54+00:00",
        "name": "Andy Warhol",
        "sortable_name": "Warhol Andy",
        "gender": "male",
        "biography": "An American painter, printmaker, sculptor, draughtsman, illustrator, filmmaker, writer and collector, who became one of the most famous artists of the 20th century. Warhol began his career as a successful commercial artist and illustrator for magazines and newspapers but by 1960 was determined to establish his name as a painter. He quickly became renowned for painting everyday advertisements or images from comic strips that looked eerily similar to the originals and contained no traditional marks of an artist. Warhol accentuated this look through the use of silkscreens and by painting in collaboration with a team of assistants in a studio he called \"The Factory.\" In the late sixties, Warhol turned his attention to making experimental films and multimedia events, and in the 1970s, to creating commissioned portraits. During the 1980s Warhol continued to exert an influence on the art world, collaborating with young artists such as Jean-Michel Basquiat and creating a series of paintings, which engaged with Renaissance masterworks.",
        "birthday": "1928",
        "deathday": "1987",
        "hometown": "Pittsburgh, PA, USA",
        "location": "New York, NY, USA",
        "nationality": "American",
        "target_supply": true,
  4. Using the artist id, display their artwork
  5. Using the artwork id, display similar pieces in a section below this
  6. Using the artist id, display similar artists at the end
*/
// Austin's xapp expires: 4-17
const xapptoken = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IiIsInN1YmplY3RfYXBwbGljYXRpb24iOiIyZGRmN2VkOC1mZTAyLTQxN2YtYTM2Ni03NGE2NTg4NWNlODgiLCJleHAiOjE3MTMzNzQzMTAsImlhdCI6MTcxMjc2OTUxMCwiYXVkIjoiMmRkZjdlZDgtZmUwMi00MTdmLWEzNjYtNzRhNjU4ODVjZTg4IiwiaXNzIjoiR3Jhdml0eSIsImp0aSI6IjY2MTZjOWU2MDcyOTIwMDAwZDJkMGY3YyJ9.hUlWDCDi2LlPKnLQi4w6efJWMUtkPXh3nUvBNHxEtgo';

app.get('/artists', async (req, res) => {
  keyArtistID = req.query.keyword;
  //if there is no keyword: display all artists
  if(!keyArtistID){
    try {
      keyArtistID = '4d8b92b34eb68a1b2c0003f4';
      const similarArtistsResponse = await axios({
        url: 'https://api.artsy.net/api/artists/?similar_to_artist_id=',
        method: 'GET',
        dataType: 'json',
        headers: {
          'X-XApp-Token': xapptoken
        },
        params: {
          'similar_to_artist_id' : keyArtistID
        }
      });
      
      var response = similarArtistsResponse.data._embedded.artists;
      if(!response){
        res.render('/allArtists', {results: [], message: 'Error on backend. You suck, Austin.'});
      }
      


    } catch (error) {
      console.error(error);

      // If the API call fails, render pages/discover with an empty results array and the error message
      res.render('./pages/allArtists', { results: [], message: 'An error occurred while fetching data from the Artsy API.' });
    }

  }
  else{
    redirect('/artist', {keyArtistID});
  }
});


// For displaying a single artist:
app.get('/artist', async (req,res) =>{
  const keyword = req.query.keyword;
  if(!keyword){
    res.redirect('/artists', {message: 'Artist page failed to load. Please try again. -Error 9 sent: beating will continue for the Dev responsible'})
  }

  try{
    const artistSearch = await axios({
      url : 'https://api.artsy.net/api/artists/?',
      method: 'GET',
      datatype: 'json',
      headers: { 'X-XApp-Token' : xapptoken},
      params:{
        'q' : keyword
      }
    });
  } catch(error){
    console.error(error);
    res.render('/artist', {message: 'Error generating web page. Commence beating developer responsible.'});
  }
  
  const artistURL = artistSearch.data._embedded.results[0]._links.self.href;
  if(!artistData)  {
    res.redirect('/artists', {message: 'Error finding artist data, beat dev team at 5:01pm'});
  }
try{
  const response = await axios({
    url: artistURL,
    method: 'GET',
    datatype: 'json',
    headers: { 'X-XApp-Token': xapptoken}
  })
  } catch(error){
    console.error(error);
    res.render('/artist', {message: 'Error generating web page. Commence beating developer responsible.'});
  }
});


// *****************************************************
// <!               Logout - Nate                   >
// *****************************************************

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('pages/logout', {message: 'Logged out Successfully!'});
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');



// *****************************************************
// <!-- Section 11 : Lab 11-->
// *****************************************************app.get('/welcome', (req, res) => {
  app.get('/welcome', (req, res) => {
    res.json({status: 'success', message: 'Welcome!'});
  });

//Below we add a one time user, named abc, with password 1234. This is for use in testing, and general data base stuff.
(async () => {
  const onetimeuser = 'abc';
  const onetimehash = await bcrypt.hash('1234', 10);
  const onetimeuserExists = await db.oneOrNone('SELECT username FROM users WHERE username = $1', [onetimeuser]);
  if (!onetimeuserExists) {
    await db.none('INSERT INTO users(username, password, email, firstname, lastname) VALUES($1, $2, $3, $4, $5)', [onetimeuser, onetimehash,'rehehe@gmail.com','Scooby','Doo']);
  }
})();