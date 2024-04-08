$(document).ready(function() {
    // Function to fetch artists data from server
    function fetchArtistsData() {
      $.ajax({
        url: '/artists', // Endpoint to fetch artists data from
        type: 'GET',
        success: function(response) {
          // Handle successful response and render artists data
          renderArtists(response.artists);
        },
        error: function(xhr, status, error) {
          console.error('Error fetching artists:', error);
          // Handle error gracefully
        }
      });
    }
  
    // Function to render artists data
    function renderArtists(artists) {
      // Your logic to render artists data goes here
      // This is just a placeholder, replace it with actual rendering logic
      artists.forEach(artist => {
        // Render each artist
        console.log(artist);
      });
    }
  
    // Call function to fetch artists data when document is ready
    fetchArtistsData();
  });
  
