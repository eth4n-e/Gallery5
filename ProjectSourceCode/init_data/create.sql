/*flesh out database*/
CREATE TABLE users (
    /*id SERIAL NOT NULL*/
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
    /*
    think about a column for:
    - favorite artists
    - favorited artworks
    - events registered for
    - collection
    */
);

CREATE TABLE Artists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    /*
    think about connection to artworks
    - thinking an array to store all artworks with the same id / artist_id
    */    
);

/*Question for Varsha: should we store the images we receive from API calls*/
CREATE TABLE Artworks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    artist_id INT NOT NULL,
    artist VARCHAR(50) NOT NULL, 
);