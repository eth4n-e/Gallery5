INSERT INTO users (username, password, email)
VALUES
    ('admin', '1234', 'admin@cu.edu'),
    ('tester', '1234', 'tester@cu.edu'),
    ('Joseph Robinette Biden Jr.', '1234', 'joebiden@whitehouse.gov')
    ;

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

INSERT INTO events (event_name, event_date, event_time, event_location, event_lattitude, event_longitude, event_description, event_image, user_id)
VALUES
    ('Test Event 1', '2021-12-01', '12:00:00', 'Test Location 1', '39.93682', '-105.04392', 'Test Description 1', 'test_image_1.jpg', (SELECT user_id FROM users WHERE username='admin')),
    ('Test Event 2', '2021-12-02', '12:00:00', 'Test Location 2', '39.95968257960303', '-105.03287645398008', 'Test Description 2', 'test_image_2.jpg', (SELECT user_id FROM users WHERE username='admin')),
    ('Ice Cream Art Discovery Panel', '2024-12-03', '12:00:00', 'Test Location 3', '39.86481853909692', ', -105.12053605549596', 'We will discuss the beautiful, and inherently artistitc, nature of ice cream', 'test_image_3.jpg', (SELECT user_id FROM users WHERE username='Joseph Robinette Biden Jr.')),
    ('Test Event 4', '2021-12-04', '12:00:00', 'Test Location 4', '0.0', '0.0', 'Test Description 4', 'test_image_4.jpg', (SELECT user_id FROM users WHERE username='admin'));