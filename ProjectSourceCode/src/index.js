// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const { storage } = require('./storage/storage');
const multer = require('multer');
const upload = multer({ storage });


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
const { start } = require('repl');
const { get } = require('http');
  
//ask about how to get .env variables when in different directory

app.use('/resources', express.static('resources'));

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

//string equality helper for handlebars ifelse
hbs.handlebars.registerHelper('eq', function(a, b, opts) {
  console.log(a, b);
  if (a === b) {
      return opts.fn(this);
  } else {
      return opts.inverse(this);
  }
});

hbs.handlebars.registerHelper('arrayIndex', function (array, index) {
  console.log(array, index);
  var x=Number(index);
  return array[x];
});

hbs.handlebars.registerHelper("setVar", function(varName, varValue, options) {
  options.data.root[varName] = varValue;
});

hbs.handlebars.registerHelper('find', function (array, value) { 
  if(array.includes(value))
    return true;
  return false;
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
// <!               Login - Amy                   >
// *****************************************************
const user = {
    username: undefined,
    email: undefined,
    firstname: undefined,
    lastname: undefined,
    user_id: undefined
  };

  app.get('/',(req,res)=>{
    res.redirect('/discover');
  });

  app.get('/login', (req, res) => {
    res.render('pages/login');
  });
  
  app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  //console.log(username, password);

    try {
        // Find the user from the database
        const user_db = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);
        
        if (user_db) {
          // Check if the entered password matches the stored hashed pord
          
          const passwordMatch = await bcrypt.compare(password, user_db.password);
          console.log('_____________');
          console.log(user_db.user_id);
          if (passwordMatch) {
            // Save the user in the session variable
            user.user_id = user_db.user_id;
            user.username = user_db.username;
            // user.password = user_db.password;
            user.email = user_db.email;
            user.firstname = user_db.firstname;
            user.lastname = user_db.lastname;
            req.session.user = user;
            req.session.save();
            console.log(user);
            // Redirect to /discover route after setting the session
            //res.render('pages/discover', {username: req.session.user.username});
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
// <!          Individual-Artwork-Ethan                  >
// *****************************************************
app.get('/artwork/:id', async (req, res) => {
  try {
    const artwork_id = req.params.id;

    const api_url = `https://api.artic.edu/api/v1/artworks/${artwork_id}`;
    const artworkData = await axios.get(api_url);
    const artwork = artworkData.data.data;

    const img_src = `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`;
    //having trouble getting related artworks to work atm, come back
      // figure out how to use public domain
      // also how to possibly differentiate the inputs into the .hbs file
        // thought: the related artworks information might be getting overwritten
                // by the information related to the primary artwork
    // const related_artworks_api_url = `https://api.artic.edu/api/v1/artworks/search?query[term][style_id]=${artwork.style_id}&fields=id,title,image_id,description,artist_display&size=4`;
    // const related_artwork_data = await axios.get(related_artworks_api_url);
    // const related_artworks = related_artwork_data.data;

    // console.log(artwork, related_artworks);
    res.render('pages/oneArtwork', {id: artwork.id, artist_display: artwork.artist_display, description: artwork.description, title: artwork.title, medium_display: artwork.medium_display , date_display: artwork.date_display , image_src: img_src, username: req.session.user.username});
  } catch(error) {
    console.log(error);
  }
  let commentSearch;
  try {
    commentSearch = await db.many('SELECT comment_text FROM comments WHERE comments.artwork_id = artwork_id');
    // Handle useEventsTemp as needed
  } catch (error) {
    // Handle the error (e.g., log it or take appropriate action)
    console.error(error);
  }
});
  
// *****************************************************
// <!          Comments-nate                  >
// *****************************************************



app.post('/artworks', async (req, res) => {

})
////

// *****************************************************
// <!          Artworks-Ethan                  >
// *****************************************************

// generate an offset to be used in api calls for artworks
// using 900 because offsets greater led to errors in request
function generateOffsets() {
  return Math.floor(Math.random() * 900);
}

app.get('/artworks', async (req, res) => {
  //Note: there is around 27000 artworks provided by artsy
  //going to select a sample of around 100 to show
  try {
    const art_offset = generateOffsets();
   
    const api_url = `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=id,title,image_id,description,artist_display&from=${art_offset}&size=36`;
    const response = await axios.get(api_url);

    const artworks = response.data.data;
    res.render('pages/artworks', {artworks, username: req.session.user.username});

  } catch(error) {
    console.log(error);

    res.redirect('/discover');
  }
})


// *****************************************************
// <!          Home / Discover-Ethan                  >
// *****************************************************

// handle events api call
function getEvents() {
  //axios.get(url, config *e.g headers and such*)
  const config = {
    headers: {
      'X-XAPP-Token': process.env.X_XAPP_TOKEN
    },
    params: {
      status: 'running_and_upcoming',
      size: 4
    }
  };
  return axios.get('https://api.artsy.net/api/fairs', config)
    .catch(err => {
      console.log(err);
    });
}

// handle artworks api call
function getArtworks() {
  // setup for API call
  const artwork_offset = generateOffsets();
  const api_url = `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&fields=id,title,image_id,description,artist_display&from=${artwork_offset}&size=4`;

  //axios.get(url, config *e.g headers and such*)
  return axios.get(api_url)
    .catch(err => {
      console.log(err);
    });
}

// handle artists api call
function getArtists() {
  const artist_offset = generateOffsets();
  
  const api_url = `https://api.artic.edu/api/v1/agents/search?query[term][is_artist]=true&fields=id,title,description,birth_date&from=${artist_offset}&size=4`;
  //axios.get(url, config *e.g headers and such*)

  return axios.get(api_url)
    .catch(err => {
      console.log(err);
    })
}

function scrapeArtistImages(artist_name) {
  const api_url = `https://api.artic.edu/api/v1/artworks/search?q=${artist_name}&fields=image_id`

  axios.get(api_url)
  .then(artists_artworks => {
    //return the first image id for a particular artist
    return artists_artworks.data.data[0].image_id;
  }).catch(err => {
    console.log(err);
  })
}

app.get('/discover', async (req, res) => {
try {
  // when successful, Promise.all returns an array of the fulfilled promises (responses is an array)
  const [/*eventsRes,*/ artworksRes, artistsRes] = await Promise.all([/*getEvents(),*/ getArtworks(), getArtists()]); 

  // const events = eventsRes.data._embedded.fairs;
  const artworks = artworksRes.data.data;
  console.log(artworks); // this is an array of objects
  var artists = artistsRes.data.data;
  artists.thumbnail = [];
  // Call the getArtistThumb in a loop and append artist image
  for( var i = 0; i < artists.length; i++) {
    console.log(artists[i]);
    const thumby = await getArtistThumb_Bio(artists[i].title);
    console.log(thumby);
    if(thumby.thumbnail)
      artists[i].thumbnail = thumby.thumbnail;
    else
      artists[i].thumbnail = "/resources/images/noimageavail.png";
  }


console.log("test");
  //To get evevnts:
  const currentDate = new Date();
  const futureDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const currentISODate = currentDate.toISOString().slice(0, 19)+"Z"; // Format: 2024-04-11T07:33:26
  const futureISODate = futureDate.toISOString().slice(0, 19)+"Z"; // Format: 2024-04-18T07:33:26

  const results=await axios({ //get in the fine arts within one week of right now
    url: 'https://app.ticketmaster.com/discovery/v2/events.json',
    method: 'GET',
    params: {
      apikey: process.env.TICKET_API_KEY,
      startDateTime: currentISODate, //right now
      endDateTime: futureISODate, //one week from now
      classificationName: 'fine-art', //search in the fine arts
      //size: 10, //get 10 events
      sort: 'random' //sort 
    }
  });
  var eventsArr= []; //array to store events
  //console.log(results.data._embedded.events);
  for(var i=0; i<results.data._embedded.events.length; i++){
    var checker=false;
    var event = results.data._embedded.events[i];
    var eventName = event.name;
    var eventDescp = event.info;
    var eventLink = event.url;
    var eventDate = event.dates.start.localDate;
    var eventImage= event.images?.[0]?.url || "https://via.placeholder.com/150";
    var eventLocation= event._embedded.venues?.[0]?.name ||"Location not available";

    
    
    var newEvent = new Events(eventName, eventDescp, eventLink, eventDate, eventLocation, eventImage);
    for(var j=0; j<eventsArr.length; j++){ //check if event already in array
      if(eventsArr[j].eventName === newEvent.eventName){ //if it is
        //onsole.log("test");
        if(eventsArr[j].eventDate <= newEvent.eventDate){ //check if the date of the event in the array is less than the new event
          checker=true;
          break; //if it is, then no need to updatem, leave as is, and break the loop
        }
        else{
          eventsArr.splice(j, 1); //if the date of the event in the array is greater than the new event, remove the event in the array
        }
      }
    }
    if(checker) continue; //if the event is already in the array and the date is less than the new event, continue to the next event
 
    eventsArr.push(newEvent); //add the new event to the array
  }

  //now we want to sort the array by date ascendng:
  eventsArr.sort(function(a,b){
    return new Date(a.eventDate) - new Date(b.eventDate);
  });

  //now only send the first 4 events
  eventsArr=eventsArr.slice(0, 4);

  /*************************
   * User images in discover:
   *************************/

  //call function to get userimages
  const userImages = await getUserImages(4); //get user images
  console.log("Userimages obj: " + userImages);
  
  // Give to discover.hbs
  // allow the discover page to access the returned events, artworks, artists
  res.render('pages/discover', { /*events,*/ artworks, artists, eventsArr, userImages, username: req.session.user.username });
} catch (error) {
  console.error(error);

  // If the API call fails, render pages/discover with an empty results array and the error message
  res.render('pages/discover', { results: [], message: 'An error occurred while fetching data from the Artsy API.' ,username: req.session.user.username });
}
});



// *****************************************************
// <!               Events - Khizar                   >
// *****************************************************
app.get('/events', (req, res) => {
  res.render('pages/events', {username: req.session.user.username});
});

function Events(eventName, eventDescp, eventLink, eventDate, eventLocation, eventImage) {
  this.eventName = eventName;
  this.eventDescp = eventDescp;
  this.eventLink = eventLink;
  this.eventDate = eventDate;
  this.eventLocation = eventLocation;
  this.eventImage=eventImage;
}

function userEvents1(eventName, eventDescp, eventDate, eventLocation,eventImage,eventDateNoTime){
  this.eventName=eventName;
  this.eventDescp=eventDescp;
  this.eventDate=eventDate;
  this.eventLocation=eventLocation;
  this.eventImage=eventImage;
  this.eventDateNoTime=eventDateNoTime;

}

function getDaysOfWeek(){
  const weekdays= new Map(); //this map maps weekday names to their index
  weekdays.set(0,'Sunday');
  weekdays.set(1,'Monday');
  weekdays.set(2,'Tuesday');
  weekdays.set(3,'Wednesday');
  weekdays.set(4,'Thursday');
  weekdays.set(5,'Friday');
  weekdays.set(6,'Saturday');

  const today =new Date(); 
  const curr= today.getDay(); //get index of current day
  var daysOfWeek=[];
  for(var i=0; i<7;i++){
    daysOfWeek.push(weekdays.get((curr+i)%7)); //get the day of the week for the next 7 days
  }
  return daysOfWeek;
}

function getDatesForWeek(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  if(dd<10) {
      dd='0'+dd
  }
  if(mm<10) {
      mm='0'+mm
  }
  today = yyyy+'-'+mm+'-'+dd; //we now have the curent date
  var datesForWeek=[];
  for(var i=0; i<7; i++){
    var newDate = new Date(today);
    newDate.setDate(newDate.getDate()+i);
    datesForWeek.push(newDate.toISOString().slice(0, 10)); //get the date for the next 7 days
  }
  return datesForWeek;
}

Number.prototype.toRad = function() {
  return this * Math.PI / 180;
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  // console.log(lat1, lon1);
  // console.log(lat2, lon2);
  var R = 6371; // km 
  //has a problem with the .toRad() method below.
  var x1 = lat2-lat1;
  var dLat = x1.toRad();  
  var x2 = lon2-lon1;
  var dLon = x2.toRad();  
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                  Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);  
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; 
  console.log(d);
  return d;
}

 
app.post('/events', async(req,res)=>{
  
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  console.log(req.body)
  const lat =await req.body.latitude; //get user lat
  const long = await req.body.longitude; //get user long
  const currentDate = new Date();
  const currentISODate = currentDate.toISOString().slice(0, 19)+"Z"; // Format: 2024-04-11T07:33:26
  
  //const currentISODate = currentDate.toISOString(); // Format: 2024-04-11T07:33:26.162Z
  const futureDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  //const futureISODate = futureDate.toISOString(); // Format: 2024-04-18T07:33:26.162Z
  const futureISODate = futureDate.toISOString().slice(0, 19)+"Z"; // Format: 2024-04-18T07:33:26

  //console.log(currentISODate, futureISODate);

  const results=await axios({ //get in the fine arts within one week of right now
    url: 'https://app.ticketmaster.com/discovery/v2/events.json',
    method: 'GET',
    params: {
      apikey: process.env.TICKET_API_KEY,
      startDateTime: currentISODate, //right now
      endDateTime: futureISODate, //one week from now
      classificationName: 'fine-art', //search in the fine arts
      //size: 10, //get 10 events
      sort: 'random' //sort 
    }
  });
  
  var eventsArr= []; //array to store events
  //console.log(results.data._embedded.events);
  for(var i=0; i<results.data._embedded.events.length; i++){
    var checker=false;
    var event = results.data._embedded.events[i];
    var eventName = event.name;
    var eventDescp = event.info;
    var eventLink = event.url;
    var eventDate = event.dates.start.localDate;
    var eventImage= event.images?.[0]?.url || "https://via.placeholder.com/150";
    var eventLocation= event._embedded.venues?.[0]?.name ||"Location not available";
   // console.log(i);
    //console.log(event);
    
    
    
    var newEvent = new Events(eventName, eventDescp, eventLink, eventDate, eventLocation, eventImage);
    for(var j=0; j<eventsArr.length; j++){ //check if event already in array
      if(eventsArr[j].eventName === newEvent.eventName){ //if it is
        //onsole.log("test");
        if(eventsArr[j].eventDate <= newEvent.eventDate){ //check if the date of the event in the array is less than the new event
          checker=true;
          break; //if it is, then no need to updatem, leave as is, and break the loop
        }
        else{
          eventsArr.splice(j, 1); //if the date of the event in the array is greater than the new event, remove the event in the array
        }
      }
    }
    if(checker) continue; //if the event is already in the array and the date is less than the new event, continue to the next event
    //if(i==0) console.log(event._embedded.venues[0].name);
    eventsArr.push(newEvent); //add the new event to the array
  }
  // for(var i=0; i<eventsArr.length; i++){
  //   console.log(eventsArr[i].eventName);
  //   console.log(eventsArr[i].eventDate);
  // }
  //console.log("TEST");

  //now we want to sort the array by date ascendng:
  eventsArr.sort(function(a,b){
    return new Date(a.eventDate) - new Date(b.eventDate);
  });

  for(var i=0; i<eventsArr.length; i++){
    console.log(eventsArr[i].eventName);
    console.log(eventsArr[i].eventDate);
  }

  // const user_id_for_admin= await db.oneOrNone('SELECT user_id FROM users WHERE username = $1', ["admin"]);
  // console.log(user_id_for_admin);

  let useEventsTemp;
  try {
    useEventsTemp = await db.many('SELECT * FROM events');
    // Handle useEventsTemp as needed
  } catch (error) {
    // Handle the error (e.g., log it or take appropriate action)
    console.error(error);
  }
  useEventsTemp= await db.many('SELECT * FROM events ORDER BY event_date ASC'); //pre sort by date 

/// console.log(useEventsTemp);
 var userEvents=[];

  for(var i=0; i<useEventsTemp.length; i++){ //loop through and check if lat and long is within 160 km (or about 100 mi) of user.
    //console.log(parseFloat(useEventsTemp[i].event_latitude), parseFloat(useEventsTemp[i].event_longitude)+20.0);
    //console.log(lat, long);
    var distance = getDistanceFromLatLonInKm(parseFloat(lat), parseFloat(long), parseFloat(useEventsTemp[i].event_latitude), parseFloat(useEventsTemp[i].event_longitude));
    
    console.log(distance);
    if(distance <= 160){
      const dateNoTime= useEventsTemp[i].event_date.toISOString().slice(0, 10);
      var newEvent = new userEvents1(useEventsTemp[i].event_name, useEventsTemp[i].event_description, useEventsTemp[i].event_date, useEventsTemp[i].event_location, useEventsTemp[i].event_image,dateNoTime);
      userEvents.push(newEvent);
    }
  }
  //now we want to sort userEvents by date asc
  // userEvents.sort(function(a,b){
  //   return new Date(a.eventDate) - new Date(b.eventDate);
  // });

  console.log(userEvents);
  //console.log(userEvents[0].eventDateNoTime);
  console.log(getDatesForWeek());
  // console.log(getDaysOfWeek());
  const daysOfWeek = getDaysOfWeek();
  const datesForWeek = getDatesForWeek();

  //now at this point one would hope we could just render the events page, by passing the following params:API_KEY, lat, long, eventsArr, userEvents, daysOfWeek, datesForWeek
  //API KEY for the map, lat and long for the map, eventsArr for the events, userEvents for the user events, daysOfWeek for the days of the week to put events (like Monday), and datesForWeek for the dates of the week (like 1/2/23)
  //but Handlebars is absolutely dog water and we cant pass non literals as the second argment to a handelbars helper, so we have to do this in the backend for some god forsaken reason.

  //we will literally pass 7 arrays back to the front end lmao. Each array will contain all events on that day.

  const events1= await db.manyOrNone('SELECT * FROM events WHERE event_date = $1', [datesForWeek[0]]);
  const events2= await db.manyOrNone('SELECT * FROM events WHERE event_date = $1', [datesForWeek[1]]);
  const events3= await db.manyOrNone('SELECT * FROM events WHERE event_date = $1', [datesForWeek[2]]);
  const events4= await db.manyOrNone('SELECT * FROM events WHERE event_date = $1', [datesForWeek[3]]);
  const events5= await db.manyOrNone('SELECT * FROM events WHERE event_date = $1', [datesForWeek[4]]);
  const events6= await db.manyOrNone('SELECT * FROM events WHERE event_date = $1', [datesForWeek[5]]);
  const events7= await db.manyOrNone('SELECT * FROM events WHERE event_date = $1', [datesForWeek[6]]);

  // console.log(datesForWeek[5]);
  console.log(events1);
  
  res.render('pages/events', {API_KEY, lat, long, eventsArr, userEvents, daysOfWeek, datesForWeek, events1, events2, events3, events4, events5, events6, events7, username: req.session.user.username});
  
  
});

function parseSpaces(stringToParse){ //function to parse spaces in a string
  var newString = stringToParse.replace(/\s/g, '%20');
  return newString;


}

app.post('/addEvent', async(req,res)=>{
  const eventName = req.body.eventName;
  const eventDescp = req.body.description;
  const eventDate = req.body.eventDate;
  const streetAddy= req.body.streetAddress; // love the streetAddy -Amy
  const city = req.body.city;
  const state = req.body.state;
  const zip = req.body.postalCode;

  const eventLocation = streetAddy + " " + city + " " + state + " " + zip;
  const eventLocation2 = parseSpaces(eventLocation);
  const location=await axios({ //get in the fine arts within one week of right now
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    method: 'GET',
    params: {
      key: process.env.GOOGLE_MAPS_API_KEY,
      address: eventLocation2
    }
  });

  console.log(location.data.results[0].geometry.location.lat);
  console.log(location.data.results[0].geometry.location.lng);

  //now we can add the data to the events db:
  await db.none('INSERT INTO events(event_name, event_description, event_date, event_location, event_latitude, event_longitude) VALUES($1, $2, $3, $4, $5, $6)', [eventName, eventDescp, eventDate, eventLocation, location.data.results[0].geometry.location.lat, location.data.results[0].geometry.location.lng]);
  res.redirect('/events');

}); //add event to user events
 

// *****************************************************
// <!               Profile- Catherine                 >
// *****************************************************
app.get('/profile', async (req, res) => {
  try {
    const user_id = req.session.user.user_id;
    
    // Fetch user's followed artists
    const followedArtists = await db.any(
      `SELECT a.* 
       FROM artists a
       INNER JOIN user_artists ua ON a.artist_id = ua.artist_id
       WHERE ua.user_id = $1`,
      [user_id]
    );

    // Fetch user's events
    const userEvents = await db.any(
      `SELECT * 
       FROM events 
       WHERE user_id = $1`,
      [user_id]
    );

    //get all image  links and image ids from the users images
    //const userImages= await db.any( 'SELECT * FROM images WHERE user_id = $1', [user_id]);
    
    //console.log(userId2.user_id);
    const userImages= await db.any( 'SELECT * FROM images WHERE user_id = $1', [user_id]);
    console.log(userImages);
    // Render the profile page and pass the followed artists and user's events data to it
    res.render('pages/profile', { followedArtists, userEvents , userImages, username: req.session.user.username});
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching profile data.');
  }
});

// *****************************************************
// <!               Profile-Post-Artwork                 >
// *****************************************************
app.post('/profile/:username/collection/:artworkId', async (req, res) => {
  try {
    console.log('route called');
  } catch(err) {
    console.log(err);
  }
});

// *****************************************************
// <!       Artist and Artist Follow -Austin                >
// *****************************************************

var page = Math.floor(Math.random() * 99) + 1;
var followed_Artist_list= [];

async function getArtistThumb_Bio(artistName) {
  const wikiURL = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|extracts&titles=${artistName}&origin=*&pithumbsize=100`;
  try {
    const response = await axios.get(wikiURL);
    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const artistInfo = pages[pageId];
    return {
      thumbnail: artistInfo.thumbnail ? artistInfo.thumbnail.source : null,
      extract: artistInfo.extract
    };
  } catch (error) {
    console.error(`Error retrieving data from Wikipedia for: ${artistName}`, error);
    return null; // or handle the error as you prefer
  }
}

app.get('/artists', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    // Display all artists
    try {
      const artistData = await axios.get('https://api.artic.edu/api/v1/artists/search?=query=*&limit=100&page=${page}');

      // Retrieve additional data from Wikipedia for each artist
      const artistsWithThumbnails = await Promise.all(artistData.data.data.map(async (data) => {
        const artistInfo = await getArtistThumb_Bio(data.title);
        return {
          ...data,
          thumbnail: artistInfo.thumbnail,
          bio: artistInfo.extract
        };
      }));
      res.render('./pages/allArtists', {
        artists: artistsWithThumbnails,
        username: req.session.user.username,
        followedArtists: req.session.followArtistsList
      });
    } catch (error) {
      console.error(error);
      res.render('./pages/allArtists', { message: 'Error generating web page. Please try again. Dev note: Index-728.', username: req.session.user.username });
    }
  } else {
    // Redirect to the artist page based on the keyword
    res.redirect(`/artist/${keyword}`);
  }
});


// Display a specific artist's page based on an artistID from Art Institute of Chicago API
app.get('/artist/:artistID', async (req, res) => {
  if(!followed_Artist_list)
    updateFollowedArtists();
  const artistId = req.params.artistID;
  const artistURL = `https://api.artic.edu/api/v1/artists/${artistId}`;
  try {
    const artistResponse = await axios.get(artistURL);
    const artistData = artistResponse.data.data; // Adjusted according to the API response structure

    const wikiData = await getArtistThumb_Bio(artistData.title); // Assuming title is the correct field
    if (wikiData) {
      const artistInfo = {
        id: artistData.id, // Added id property
        name: artistData.title,
        thumbnail: wikiData.thumbnail,
        biography: wikiData.extract, // Changed from extract to biography
        bday: artistData.birth_date,
        dday: artistData.death_date,
        // Add other properties as needed
      };

      res.render('./pages/artist', { artist: artistInfo, username: req.session.user.username, followedArtists: followed_Artist_list });
    } else {
      res.render('./pages/artist', { message: 'Error retrieving artist information.', username: req.session.user.username });
    }
  } catch (error) {
    console.error(error);
    res.render('./pages/artist', { message: 'Error generating web page. Please try again later.', username: req.session.user.username });
  }
});

module.exports = app;

app.post('/follow', async (req, res) => {
  try {
    // Assuming 'username' is stored in the session or passed in some other way
    const username = req.session.user.username; // or however you have stored the username
    const artistId = req.body.artistId;   
    const artistName = req.body.artistName; // Added artistName
    
    // console.log('artistId' + artistId); 
    // Retrieve the user_id for the logged-in user
    const userId = await db.one('SELECT * FROM users WHERE username = $1', [username]);
    if(!userId)
      return res.status(404).json({ message: 'User not found in db.' });
    const userIdInt = parseInt(userId.user_id,10); 
    // Implement the logic to follow the artist\
    //console.log(userIdInt, artistId);
     
    // Check to see if artist is in db
    const artistInDB = await db.oneOrNone('SELECT * FROM artists WHERE artist_id = $1', [artistId]);
    if (!artistInDB) {
      // If artist is not in db, add them
      await db.none('INSERT INTO artists(artist_id, artist_name) VALUES($1, $2)', [artistId, artistName]);
    }

    // Check if the artist is already followed
    const artistFollowed = await db.oneOrNone('SELECT * FROM user_artists WHERE user_id = $1 AND artist_id = $2', [userIdInt, artistId]);
    if (artistFollowed) {
      return res.status(400).json({ message: 'Artist already followed.' });
    }
    else{
      console.log("Artist not followed yet.");
      await db.none('INSERT INTO user_artists(user_id, artist_id) VALUES($1, $2)', [userIdInt, artistId]);
      updateFollowedArtists();
    }

    res.status(200).json({ message: 'Follow successful' });
  } catch (error) {
    console.error('Follow failed:', error);
    res.status(500).json({ message: 'An error occurred while attempting to follow.' });
  }
});

app.post('/unfollow', async (req, res) => {
  try {
    console.log('unfollowing post');
    // Assuming 'username' is stored in the session or passed in some other way
    const username = req.session.user.username; // or however you have stored the username
    const artistId = req.body.artistId;   
    // Retrieve the user_id for the logged-in user
    const userId = await db.one('SELECT * FROM users WHERE username = $1', [username]);
    if(!userId)
      return res.status(404).json({ message: 'User not found in db.' });
    const userIdInt = parseInt(userId.user_id,10); 
    // Implement the logic to unfollow the artist
    // Check if the artist is already followed
    const artistFollowed = await db.oneOrNone('SELECT * FROM user_artists WHERE user_id = $1 AND artist_id = $2', [userIdInt, artistId]);
    if (!artistFollowed) {
      return res.status(400).json({ message: 'Artist not followed.' });
    }
    else{
      await db.oneOrNone('DELETE FROM user_artists WHERE user_id = $1 AND artist_id = $2', [userIdInt, artistId]);
      console.log("Artist unfollowed.");
      updateFollowedArtists();
    }
  } catch (error) {
    console.error('Unfollow failed:', error);
    res.status(500).json({ message: 'An error occurred while attempting to unfollow.' });
  } finally {
    // Send a success response back to the client
    res.status(200).json({ message: 'Unfollow successful' });
  }
});

app.get('/followedArtists', async (req, res) => {
  try {
    // Get follow list from db
    const username = req.session.user.username; // Change req.session.user.username to req.session.username
    const userId = await db.one('SELECT user_id FROM users WHERE username = $1', [username]);
    console.log("User ID retrieved:", userId.user_id);
    var followed_list = await db.any('SELECT artist_id FROM user_artists WHERE user_id = $1', [userId.user_id]);
    console.log("followed_list: ", followed_list);

    let artistsInfo = []; // Array to hold all artist info

    // for loop to go through the follow list
    for (let i = 0; i < followed_list.length; i++) {
      //if follow list at i is not null, search for the artist's info using axios
      if (followed_list[i] != null) {
        const artistURL = `https://api.artic.edu/api/v1/artists/${followed_list[i].artist_id}`;
        const artiststart = await axios.get(artistURL);
        const artistThumb = await getArtistThumb_Bio(artiststart.data.data.title);
        if(artistThumb){
          const artist ={
            id: artiststart.data.data.id,
            title: artiststart.data.data.title,
            thumbnail: artistThumb.thumbnail
          }
          artistsInfo.push(artist);
        }
      } else {
        //if follow list at i is null, skip it
      }
    }
    res.render('pages/followedArtists', {
      artists: artistsInfo,
      username: req.session.user.username,
      followedArtists: followed_Artist_list    
    });
  } catch (error) {
    console.error('Error accessing db for follow listing. Please try again:', error);
    res.status(500).render("./pages/followedArtists", { message: 'An error occurred while attempting to access the database.', username: req.session.user.username });
  }
});

async function updateFollowedArtists(req, res) {
  try {
    followed_Artist_list = []; // Corrected assignment
    const username = req.session.user.username;
    const userId = await db.one('SELECT user_id FROM users WHERE username = $1', [username]);
    console.log("User ID retrieved:", userId.user_id);
    var followed_list = await db.any('SELECT artist_id FROM user_artists WHERE user_id = $1', [userId.user_id]);
    console.log("followed_list: ", followed_list);
    req.session.followedArtistsList = followed_Artist_list; // Corrected assignment
  } catch (error) {
    console.error('Error updating followed artists list:', error);
    // Consider adding an error response or throwing the error depending on how you handle errors
  }
};




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
  const userId2= await db.one('SELECT user_id FROM users WHERE username = $1', ['abc']);
  const userId= userId2.user_id;
 //want to do the following insert into images DB: ('https://res.cloudinary.com/dimflwoci/image/upload/v1713643643/CloudinaryDemo/doqm209ttr5m0zhgt4i2.png', 'Test-Image-1', (SELECT user_id FROM users WHERE username='abc'))
  await db.none('INSERT INTO images(image_link, image_title, user_id) VALUES($1, $2, $3)', ['https://res.cloudinary.com/dimflwoci/image/upload/v1713643643/CloudinaryDemo/doqm209ttr5m0zhgt4i2.png', 'Test-Image-1', userId]);
  await db.none('INSERT INTO images(image_link, image_title, user_id) VALUES($1, $2, $3)', ['https://res.cloudinary.com/dimflwoci/image/upload/v1713382059/cld-sample-4.jpg', 'Test-Image-2', userId]);

})();




const CALENDAR_EVENTS = [
    {
      name: "Running",
      day: "wednesday",
      time: "09:00",
      modality: "In-person",
      location: "Boulder",
      url: "",
      attendees: "Alice, Jack, Ben",
    },
  ];
  
  const CALENDAR_DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  
  let EVENT_MODAL;
  
  /* ********************** PART B: 6.2: CREATE MODAL ************************************** */
  
  function initializeEventModal() {
      // @TODO: Create a modal using JS. The id will be `event-modal`:
    // Reference: https://getbootstrap.com/docs/5.3/components/modal/#via-javascript
    EVENT_MODAL = new bootstrap.Modal(document.getElementById('event-modal'));

  }
  
  function openEventModal({ id, day }) {
    // Since we will be reusing the same modal for both creating and updating events,
    // we're creating variables to reference the title of the modal and the submit button
    // in javascript so we can update the text suitably
    const submit_button = document.querySelector("#submit_button");
    const modal_title = document.querySelector(".modal-title");
  
    // Check if the event exists in the CALENDAR_EVENTS by using `id`
    // Note that on the first try, when you attempt to access an event that does not exist
    // an event will be added to the list. This is expected.
    let event = CALENDAR_EVENTS[id];
  
    // If event is undefined, i.e it does not exist in the CALENDAR_EVENTS, then we create a new event.
    // Else, we load the current event into the modal.
    if (!event) {
      event = {
        name: "",
        day: day,
        time: "",
        modality: "",
        location: "",
        url: "",
        attendees: "",
      };
  
      // @TODO: Update the innerHTML for modalTitle and submitButton
      // Replace <> with the correct attribute
      modal_title.innerHTML = "Create Event";
      submit_button.innerHTML = "Create Event";
      // Allocate a new event id. Note that nothing is inserted into the CALENDAR_EVENTS yet.
      // @TODO: Set the id to be the length of the CALENDAR_EVENTS because we are adding a new element
      id=Object.keys(CALENDAR_EVENTS).length;
  
    } else {
      // We will default to "Update Event" as the text for the title and the submit button
      modal_title.innerHTML = "Update Event";
      submit_button.innerHTML = "Update Event";
    }
  
    // Once the event is fetched/created, populate the modal.
    // Use document.querySelector('<>').value to get the form elements. Replace <>
    // Hint: If it is a new event, the fields in the modal will be empty.
    document.querySelector("#event_name").value = event.name;
    // @TODO: Update remaining form fields of the modal with suitable values from the event.
    document.querySelector("#event_weekday").value = event.day;
    document.querySelector("#event_time").value = event.time;
    document.querySelector("#event_modality").value = event.modality;
    document.querySelector("#event_location").value = event.location;
    document.querySelector("#event_remote_url").value = event.url;
    document.querySelector("#event_attendees").value = event.attendees;

  
  
    // Location options depend on the event modality
    // @TODO: pass event.modality as an argument to the updateLocationOptions() function. Replace <> with event.modality.
    updateLocationOptions(event.modality);

    // Set the "action" event for the form to call the updateEventFromModal
    // when the form is submitted by clicking on the "Creat/Update Event" button
    const form = document.querySelector("#event-modal form");
    form.setAttribute("action", `javascript:updateEventFromModal(${id})`);
  
    EVENT_MODAL.show();
  }

  function updateEventFromModal(id) {
    // @TODO: Pick the modal field values using document.querySelecter(<>).value,
    // and assign it to each field in CALENDAR_EVENTS.
    CALENDAR_EVENTS[id] = {
      name: document.querySelector('#event_name').value,
      day: document.querySelector('#event_weekday').value,
      time: document.querySelector('#event_time').value,
      modality: document.querySelector('#event_modality').value,
      location: document.querySelector('#event_location').value,
      url: document.querySelector('#event_remote_url').value,
      attendees: document.querySelector('#event_attendees').value,
    };
    // Update the dom to display the newly created event and hide the event modal
    updateDOM();
    EVENT_MODAL.hide();
  }


  function updateLocationOptions(modality_value) {
    // @TODO: get the "Location" and "Remote URL" HTML elements from the modal.
    // Use document.querySelector() or document.getElementById().
    const location =  document.getElementById('event_location')//get the "Location" field
    const remoteUrl = document.getElementById('event_remote_url')// get the "Remote URL" field
  
    // @TODO: Depending on the "value" change the visibility style of these fields on the modal.
    // Use conditional statements.
    if (modality_value == "In-person") {
      remoteUrl.style.visibility="hidden";
      location.style.visibility="visible";
    }
    else if(modality_value == "Remote"){
      location.style.visibility="hidden";
      remoteUrl.style.visibility="visible";
    }
  }

  /* ********************************************************************************** */
  
  /* ********************** PART B: 6.1: CREATE CALENDAR ************************************** */
  
  function createBootstrapCard(day) {  
    // @TODO: Use `document.createElement()` function to create a `div`
    var card = document.createElement('div');
      // Let's add some bootstrap classes to the div to upgrade its appearance
      // This is the equivalent of <div class="col-sm m-1 bg-white rounded px-1 px-md-2"> in HTML
      (card.className = 'col-sm m-1 bg-white rounded px-1 px-md-2');
    // This the equivalent of <div id="monday"> in HTML
    card.id = day.toLowerCase();
    return card;
  }
  
  function createTitle(day) {
  // Create weekday as the title.
  // @TODO: Use `document.createElement()` function to create a `div` for title
  const title = document.createElement('div');
  title.className = 'h6 text-center position-relative py-2';
  title.innerHTML = day;
  return title;
  }
  
  function createEventIcon(card) {
      // @TODO: Use `document.createElement()` function to add a "create an event" icon button to the card
    const icon = document.createElement("BUTTON");
    icon.className =
      'bi bi-calendar-plus btn position-absolute translate-middle start-100  rounded p-0 btn-link';
    // adding an event listener to the click event of the icon to open the modal
    // the below line of code would be the equivalent of:
    // <i onclick="openEventModal({day: 'monday'})"> in HTML.
    icon.setAttribute('onclick', `openEventModal({day: ${card.id}})`);
    return icon;
  }
  
  function createEventDiv() {
      //  @TODO: Use `document.createElement()` function to add one more div to the weekday card, which will be populated with events later.
    const eventsDiv = document.createElement('div');
    // We are adding a class for this container to able to call it when we're populating the days
    // with the events
    eventsDiv.classList.add('event-container');
    return eventsDiv;
  }
  
  function initializeCalendar() {
      // You will be implementing this function in section 2: Create Modal
  initializeEventModal();
  // @TODO: Get the div of the calendar which we created using its id. Either use document.getElementById() or document.querySelector()
  const calendarElement = document.getElementById("calendar");
    // Iterating over each CALENDAR_DAYS
    CALENDAR_DAYS.forEach(day => {
      // @TODO: Create a bootstrap card for each weekday. Uncomment the below line and call createBootstrapCard(day) function.
      var card = createBootstrapCard(day);
      // @TODO: Add card to the calendarElement. Use appendChild()
      calendarElement.appendChild(card);
      // @TODO: Uncomment the below line and call createTitle(day) function.
      var title = createTitle(day);
      // @TODO: Add title to the card. Use appendChild()
      card.appendChild(title);
      // @TODO: Uncomment the below line and call createEventIcon(card) function.
      var icon = createEventIcon(card);
      // @TODO: Add icon to the title. Use appendChild()
      title.appendChild(icon);
      // @TODO: Uncomment the below line and and call createEventDiv() function.
      var eventsDiv = createEventDiv();
      // @TODO: Add eventsDiv to the card. Use appendChild()
      card.appendChild(eventsDiv);
    });
  // @TODO: Uncomment this after you implement the updateDOM() function
  updateDOM()
  } 
  
  /* *********************************************************************************** */
  
  /* ********************** PART B: 6.3: UPDATE DOM ************************************** */
  
  function createEventElement(id) {
      // @TODO: create a new div element. Use document.createElement().
      var eventElement = document.createElement('div');
      // Adding classes to the <div> element.
      eventElement.classList = "event row border rounded m-1 py-1";
      // @TODO: Set the id attribute of the eventElement to be the same as the input id.
      // Replace <> with the correct HTML attribute
      eventElement.id = `event-${id}`;
      return eventElement;
  }
  
  function createTitleForEvent(event) {
    var title = document.createElement('div');
    title.classList.add('col', 'event-title');
    title.innerHTML = event.name;
    return title;
  }
  
  function updateDOM() {
    const events = CALENDAR_EVENTS;
  
    events.forEach((event, id) => {
      // First, let's try to update the event if it already exists.
  
      // @TODO: Use the `id` parameter to fetch the object if it already exists.
      // Replace <> with the appropriate variable name
      // In templated strings, you can include variables as ${var_name}.
      // For eg: let name = 'John';
      // let msg = `Welcome ${name}`;
      let eventElement = document.querySelector(`#event-${id}`);
  
      // if event is undefined, i.e. it doesn't exist in the CALENDAR_EVENTS array, make a new one.
      if (eventElement === null) {
        eventElement = createEventElement(id);
        const title = createTitleForEvent(event);
  
        // @TODO: Append the title to the event element. Use .append() or .appendChild()
        eventElement.appendChild(title);
      } else {
        // @TODO: Remove the old element while updating the event.
        eventElement.remove();
        // Use .remove() with the eventElement to remove the eventElement.
      }
  
      // Add the event name
      const title = eventElement.querySelector('div.event-title');
      title.innerHTML = event.name;
  
      // Add a tooltip with more information on hover
      // @TODO: you will add code here when you are working on for Part B.
      
      // const exampleEl = document.getElementById('event');
      // const tooltip = new bootstrap.Tooltip(exampleEl, options);
      eventElement.setAttribute('data-bs-title', `Event: ${this.event_name} \n Description: ${this.eventDescp}`);
      eventElement.setAttribute('data-bs-toggle', "tooltip", `Event: ${this.event_name} \n Description: ${this.eventDescp}`);

      // @TODO: On clicking the event div, it should open the modal with the fields pre-populated.
      // Replace "<>" with the triggering action.
      eventElement.setAttribute('onclick', `openEventModal({id: ${id}})`);
  
      // console.log(event);
      // Add the event div to the parent
      document
        .querySelector(`#${event.day} .event-container`)
        .appendChild(eventElement);
    });
  
    updateTooltips(); // Declare the function in the script.js. You will define this function in Part B.
  }
  
  /* ******************************* PART C: 1. Display Tooltip ********************************************* */
  
  function updateTooltips() {
    // @TODO: Display tooltip with the Name, Time and Location of the event.
    // The formatting of the contents of the tooltip is up to your discretion.
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
  }
  
// *****************************************************
// <!-- Section 12 : Multer->
// *****************************************************

app.post('/upload', upload.single('image'), async (req, res) => {
  console.log(req.file);
  //insert image into database
  const imageLink = req.file.path;
  const imageTitle = req.body.title;
  const userId = req.session.user.user_id;
  await db.none('INSERT INTO images(image_link, image_title, user_id) VALUES($1, $2, $3)', [imageLink, imageTitle, userId]);

  res.redirect('/profile');
});


app.get('/userImages', async (req, res) => {
  try {
    const userImages = await db.any('SELECT * FROM images ORDER BY image_id DESC');
    //console.log(userImages);

    //now for any image, we want to get the username of the user who uploaded it
    for(var i=0; i<userImages.length; i++){
      const userId = userImages[i].user_id;
      const user = await db.one('SELECT username FROM users WHERE user_id = $1', [userId]);
      userImages[i].username = user.username;
    }
    //console.log(userImages);
    res.render('pages/userImages', { userImages, username: req.session.user.username });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching user images.');
  }
});

app.get('/userImages/:imageId', async (req, res) => {
  try {
    const imageId = req.params.imageId;
    const image = await db.one('SELECT * FROM images WHERE image_id = $1', [imageId]);
    const userId = image.user_id;
    const user = await db.one('SELECT username FROM users WHERE user_id = $1', [userId]);
    image.username = user.username;
    console.log(image);
    res.render('pages/specificimage', { image, username: req.session.user.username });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while fetching the image.');
  }
});

async function getUserImages(numImages){ // returns userimages for a specified number
  try {
    const query = 'SELECT * FROM images ORDER BY image_id DESC LIMIT ' + numImages;
    const userImages = await db.any(query);
    //console.log(userImages);
    console.log('results' + userImages);
    return userImages;    
  }catch(error){
    console.error(error);
    return null;
  }
}