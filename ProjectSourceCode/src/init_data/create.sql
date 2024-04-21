-- Drop tables if they exist
DROP TABLE IF EXISTS user_artists;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS events;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(300) NOT NULL,
    email VARCHAR(255) NOT NULL,
    firstname VARCHAR(60),
    lastname VARCHAR(60),
    UNIQUE(username),
    UNIQUE(email)
);

-- Create artists table
CREATE TABLE IF NOT EXISTS artists (
    artist_id VARCHAR(255) PRIMARY KEY,
    artist_name VARCHAR(120) NOT NULL,
    UNIQUE(artist_id)
);

-- Create user_artists table
CREATE TABLE IF NOT EXISTS user_artists (
    follow_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    artist_id VARCHAR(255) REFERENCES artists(artist_id),
    UNIQUE(user_id, artist_id)
);

--Create events table
CREATE TABLE IF NOT EXISTS events (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE ,
    event_time TIME,
    event_location VARCHAR(255),
    event_latitude VARCHAR(255),
    event_longitude VARCHAR(255),
    event_description TEXT,
    event_image VARCHAR(255),
    user_id INT REFERENCES users(user_id)
);

--Create artworks table 
CREATE TABLE IF NOT EXISTS artworks (
    artwork_id INT PRIMARY KEY,
    artwork_title VARCHAR(255) NOT NULL,
    image_link VARCHAR(255),
    UNIQUE(artwork_id)
);

--Create user_artworks table
CREATE TABLE IF NOT EXISTS user_to_artworks (
    user_id INT REFERENCES users(user_id),
    artwork_id INT REFERENCES artworks(artwork_id),
    UNIQUE(user_id, artwork_id)
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    comment_text TEXT,
    user_id INT REFERENCES users(user_id),
    artwork_id INT REFERENCES events(event_id)
);

--make images table for user uploaded images
CREATE TABLE IF NOT EXISTS images (
    image_id SERIAL PRIMARY KEY,
    image_link VARCHAR(255),
    image_title VARCHAR(255),
    user_id INT REFERENCES users(user_id)

);