-- Drop tables if they exist
DROP TABLE IF EXISTS user_artists;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS artists;

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
