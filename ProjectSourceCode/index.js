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
    try {
      const usernameLocal = req.body.username;
      const hash = await bcrypt.hash(req.body.password, 10);
  
      // Check if the username already exists in the database
      const userExists = await db.oneOrNone('SELECT username FROM users WHERE username = $1', [usernameLocal]);
  
      if (userExists) {
        // Username already exists, redirect to register page with error message
        return res.render('pages/register', { message: 'Username already exists. Please choose a different username.' });
      }
  
      // Register the user with the provided data
      await db.none('INSERT INTO users(username, password) VALUES($1, $2)', [usernameLocal, hash]);
  
      // Redirect to login after successful registration with message
      message = 'Success! Please login with new credentials: '
      res.render('pages/login', {message});
      } catch (error) {
      console.error(error);
      // Handle errors gracefully (e.g., display error message)
      res.render('pages/register', { message: 'An error occurred during registration. Please try again.' });
    }
  });
  
  
// *****************************************************
// <!     Authentication Middleware                   >
// *****************************************************
  // Authentication Middleware
  const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to login page if not authenticated
      return res.redirect('/login');
    }
    next(); // Allow access if authenticated
  };
  
  app.use(auth);


  
// *****************************************************
// <!          Home / Discover-Ethan                  >
// *****************************************************

// Note: we have const axios above already.
app.get('/discover', async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    const keyword = 'music'; // Change this keyword as needed

    const response = await axios({
      url: 'https://app.ticketmaster.com/discovery/v2/events.json',
      method: 'GET',
      dataType: 'json',
      headers: {
        'Accept-Encoding': 'application/json',
      },
      params: {
        apikey: apiKey,
        keyword: keyword,
        size: 10, // Size of events 
      },
    });

    // What we want from API response
    const results = response.data._embedded ? response.data._embedded.events : [];

    // Give to discover.hbs
    res.render('pages/discover', { results });
  } catch (error) {
    console.error(error);

    // If the API call fails, render pages/discover with an empty results array and the error message
    res.render('pages/discover', { results: [], message: 'An error occurred while fetching data from the Ticketmaster API.' });
  }
});


// *****************************************************
// <!               Events - Khizar                   >
// *****************************************************


// *****************************************************
// <!               Profile- Catherine                 >
// *****************************************************


// *****************************************************
// <!       Artist / Collection -Austin                >
// *****************************************************

document.addEventListener("DOMContentLoaded", function() {
  // Fetch popular and trending artists data from Artsy API
  fetchArtists('popular', '#popularArtistsRow');
  fetchArtists('trending', '#trendingArtistsRow');
});

/*  The fetchArtists function takes two parameters: 
 *     -category (either 'popular' or 'trending')
 *     -targetElementId (the ID of the HTML element where the artist cards will be inserted).
 *   Depending on the category, appropriate query parameters are defined for sorting and limiting the number of results.
 *   The Artsy API is called using Axios with the appropriate query parameters and headers (including your Artsy API token).
 *   For each artist retrieved from the API, an additional request is made to fetch the primary artwork associated with the artist.
 *   The artist's name and primary artwork information are then used to construct HTML for the artist card, which is inserted into the specified target element in the HTML.
*/

function fetchArtists(category, targetElementId) {
  // Define the query parameters based on the category (popular or trending)
  const queryParameters = {
    popular: { sort: '-partner_updated_at', size: 6 },
    trending: { sort: '-trending', size: 6 }
  };

  // Fetch artists data from Artsy API
  axios.get('https://api.artsy.net/api/artists', {
    params: queryParameters[category],
    headers: {
      'X-Xapp-Token': 'YOUR_ARTSY_API_TOKEN'
    }
  })
  .then(response => {
    // Check if the response is successful
    if (response.status === 200) {
      const artists = response.data._embedded.artists;

      // Populate artists cards
      const targetElement = document.querySelector(targetElementId);
      artists.forEach(artist => {
        // Get the primary artwork of the artist
        const primaryArtwork = artist._links.artworks.href;
        axios.get(primaryArtwork, {
          headers: {
            'X-Xapp-Token': 'YOUR_ARTSY_API_TOKEN'
          }
        })
        .then(response => {
          if (response.status === 200) {
            const artwork = response.data._embedded.artworks[0];
            // Construct HTML for artist card
            const artistCard = `
              <div class="col-md-4">
                <div class="card mb-3">
                  <img src="${artwork._links.thumbnail.href}" class="card-img-top" alt="${artist.name}">
                  <div class="card-body">
                    <h5 class="card-title">${artist.name}</h5>
                    <p class="card-text">${artwork.title}</p>
                    <!-- You can add more artist information here if needed -->
                  </div>
                </div>
              </div>
            `;
            // Append artist card to the target element
            targetElement.insertAdjacentHTML("beforeend", artistCard);
          }
        })
        .catch(error => {
          console.error('Error fetching artwork:', error);
        });
      });
    } else {
      console.error('Failed to fetch artists:', response.statusText);
    }
  })
  .catch(error => {
    console.error('Error fetching artists:', error);
  });
}







// index.js

document.addEventListener("DOMContentLoaded", function() {
  // Fetch artist data from Artsy API
  const artistId = 'YOUR_ARTIST_ID'; // Replace with the actual artist ID
  fetchArtist(artistId);
});



function fetchArtist(artistId) {
  // Fetch artist data from Artsy API
  axios.get(`https://api.artsy.net/api/artists/${artistId}`, {
    headers: {
      'X-Xapp-Token': 'YOUR_ARTSY_API_TOKEN'
    }
  })
  .then(response => {
    // Check if the response is successful
    if (response.status === 200) {
      const artist = response.data;

      // Populate artist details on the artist page
      populateArtistDetails(artist);
    } else {
      console.error('Failed to fetch artist:', response.statusText);
    }
  })
  .catch(error => {
    console.error('Error fetching artist:', error);
  });
}

function populateArtistDetails(artist) {
  // Display artist name
  const artistName = document.getElementById('artistName');
  artistName.textContent = artist.name;

  // Display artist dates and location of origin
  const artistDetails = document.getElementById('artistDetails');
  artistDetails.innerHTML = `
    <h5>${artist.birth_year ? artist.birth_year + ' - ' : ''}${artist.death_year ? artist.death_year : 'Present'}</h5>
    <h5 class="text-muted">${artist.hometown ? artist.hometown : 'Unknown'}</h5>
  `;

  // Display artist photo or placeholder
  const artistPhoto = document.getElementById('artistPhoto');
  if (artist._links.thumbnail) {
    artistPhoto.innerHTML = `<img src="${artist._links.thumbnail.href}" class="img-fluid" alt="${artist.name}">`;
  } else {
    artistPhoto.innerHTML = `<div class="placeholder">No photo available</div>`;
  }

  // Display artist biography
  const artistBio = document.getElementById('artistBio');
  artistBio.textContent = artist.biography;

  // Fetch artist's top works
  fetchTopWorks(artist._links.artworks.href);
}

function fetchTopWorks(artworksUrl) {
  axios.get(artworksUrl, {
    headers: {
      'X-Xapp-Token': 'YOUR_ARTSY_API_TOKEN'
    }
  })
  .then(response => {
    if (response.status === 200) {
      const artworks = response.data._embedded.artworks;

      // Sort artworks by popularity (you may need to implement this logic)
      // For demonstration purposes, let's assume artworks are already sorted by popularity

      // Display artist's top works
      const topWorksContainer = document.getElementById('topWorksContainer');
      artworks.forEach(artwork => {
        const artworkCard = `
          <div class="card mb-3">
            <div class="row g-0">
              <div class="col-md-4">
                <img src="${artwork._links.thumbnail.href}" class="img-fluid rounded-start" alt="${artwork.title}">
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h5 class="card-title">${artwork.title}</h5>
                  <p class="card-text">${artwork.medium}</p>
                  <!-- You can add more artwork information here if needed -->
                </div>
              </div>
            </div>
          </div>
        `;
        topWorksContainer.insertAdjacentHTML("beforeend", artworkCard);
      });
    } else {
      console.error('Failed to fetch top works:', response.statusText);
    }
  })
  .catch(error => {
    console.error('Error fetching top works:', error);
  });
}





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
app.listen(3000);
console.log('Server is listening on port 3000');