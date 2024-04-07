$(document).ready(function() {
    const xaccesstoken = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IiIsInN1YmplY3RfYXBwbGljYXRpb24iOiIyZGRmN2VkOC1mZTAyLTQxN2YtYTM2Ni03NGE2NTg4NWNlODgiLCJleHAiOjE3MTMxMjI0NDcsImlhdCI6MTcxMjUxNzY0NywiYXVkIjoiMmRkZjdlZDgtZmUwMi00MTdmLWEzNjYtNzRhNjU4ODVjZTg4IiwiaXNzIjoiR3Jhdml0eSIsImp0aSI6IjY2MTJmMjBmNWUyMThiMDAwYjc5YjhjNSJ9.A6lDkBHBbQEjVZISEodcCDasnJgsmclvsQHK55V2Pqo';

  
    // Function to fetch popular artists data from Artsy API
    function fetchPopularArtists() {
      // Make an AJAX GET request to fetch popular artists
      $.ajax({
        url: 'https://api.artsy.net/api/popular_artists',
        type: 'GET',
        headers: {
          'X-Access-Token': xaccesstoken // Replace with your Artsy API access token
        },
        success: function(response) {
          // Populate popular artists section with fetched data
          var popularArtistsRow = $('#popularArtistsRow');
          response.forEach(function(artist) {
            var artistCard = `
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h5 class="card-title">${artist.name}</h5>
                    <p class="card-text">Followers: ${artist.followers_count}</p>
                    <!-- Add more artist information here as needed -->
                  </div>
                </div>
              </div>
            `;
            popularArtistsRow.append(artistCard);
          });
        },
        error: function(xhr, status, error) {
          console.error('Error fetching popular artists:', error);
        }
      });
    }
  
    // Function to fetch trending artists data from Artsy API
    function fetchTrendingArtists() {
      // Make an AJAX GET request to fetch trending artists
      $.ajax({
        url: 'https://api.artsy.net/api/trending_artists',
        type: 'GET',
        headers: {
          'X-Access-Token': xaccesstoken // Replace with your Artsy API access token
        },
        success: function(response) {
          // Populate trending artists section with fetched data
          var trendingArtistsRow = $('#trendingArtistsRow');
          response.forEach(function(artist) {
            var artistCard = `
              <div class="col-md-4">
                <div class="card">
                  <div class="card-body">
                    <h5 class="card-title">${artist.name}</h5>
                    <p class="card-text">Followers: ${artist.followers_count}</p>
                    <!-- Add more artist information here as needed -->
                  </div>
                </div>
              </div>
            `;
            trendingArtistsRow.append(artistCard);
          });
        },
        error: function(xhr, status, error) {
          console.error('Error fetching trending artists:', error);
        }
      });
    }
  
    // Call functions to fetch and display popular and trending artists
    fetchPopularArtists();
    fetchTrendingArtists();
  });
  