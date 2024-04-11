INSERT INTO users (username, password, email)
VALUES
    ('admin', '1234', 'admin@cu.edu'),
    ('tester', '1234', 'tester@cu.edu');

INSERT INTO artists (artist_id, artist_name)
VALUES
    ('4ede73422b350f00010061b7', 'Bosco Sodi'),
    ('4e2ed55dcb8b1f0001004ac2', 'Lynne Drexler'),
    ('4dee3ea71695f00001003721', 'Elaine de Kooning'),
    ('4d8b92784eb68a1b2c00013e', 'Robert Indiana');

INSERT INTO user_artists (user_id, artist_id)
VALUES
    ('001', '4ede73422b350f00010061b7'),
    ('001', '4e2ed55dcb8b1f0001004ac2'),
    ('001', '4dee3ea71695f00001003721'),
    ('002', '4ede73422b350f00010061b7'),
    ('002', '4d8b92784eb68a1b2c00013e');
