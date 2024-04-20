const xAppToken = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IiIsInN1YmplY3RfYXBwbGljYXRpb24iOiIyZGRmN2VkOC1mZTAyLTQxN2YtYTM2Ni03NGE2NTg4NWNlODgiLCJleHAiOjE3MTM1Nzc0OTcsImlhdCI6MTcxMjk3MjY5NywiYXVkIjoiMmRkZjdlZDgtZmUwMi00MTdmLWEzNjYtNzRhNjU4ODVjZTg4IiwiaXNzIjoiR3Jhdml0eSIsImp0aSI6IjY2MTllMzk5ZmFlNWRkMDAwYjc1NzVhNyJ9.nv4SH0J6wRAOH1w5K8W3B-YmleyseJZQcIgLzcLm1TA';
var lastArtistPrinted = '';
var nextPage = '';
// Function to fetch artists by gene from Artsy API
async function fetchArtistsByGene(geneNames) {
    try {
        for (const geneName of geneNames) {
            console.log('Fetching artists for gene:', geneName); // Log the gene being fetched
            geneURL = 'https://api.artsy.net/api/genes/' + geneName;
            const response = await $.ajax({
                url: geneURL,
                type: 'GET',
                headers: { 'X-XApp-Token': xAppToken }
            });
            console.log('Artists for gene', geneName, ':', response.name); // Log the fetched artists
            if (!response._links.artists.href) {
                console.log('Bad Href');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for 1 second
                const artistsData = await $.ajax({      //  Get the artists' information
                    url: response._links.artists.href,
                    type: 'GET',
                    headers: { 'X-XApp-Token': xAppToken }
                });
                if (!artistsData) {
                    console.log('Error finding artists at: ' + response._links.artists.href);
                }
                const artistArray = [];
                for (const artist of artistsData._embedded.artists) {
                    artistArray.push(artist);
                    //console.log(artist); // Way to print artists retreived for testing
                }
                // nextPage = artistsData._links.next.href; //stores the "next page" gene
                displayArtists(artistArray, response.name); // Display artists
            }
        }
    } catch (error) {
        console.error('Error fetching X-App-Token or artists:', error);
    }
}

function displayArtists(artistArray, geneName) {
    // Assuming there's a container with id "artistsContainer" in your HTML
    var artistsContainer = $('#artistsContainer');

    // Start a new row
    var row = $('<div class="row"></div>');

    // Loop through each artist and create HTML elements to display them
    artistArray.forEach(function(artist, index) {
        // Create HTML element to display the artist
        var artistCard = $(`
            <div class="col mt-3">
                <div class="card rounded mb-3" style="cursor: pointer;">
                    <img src="${artist._links.thumbnail.href}" class="card-img-top" alt="${artist.name}">
                    <div class="card-body" data-artist-id="${artist.id}">
                        <h5 class="card-title">${artist.name}</h5>
                        <p class="card-text">Genre: ${geneName}</p>
                    </div>
                </div>
            </div>
        `);
        // <p class="card-text">Birthday: ${artist.birthday} Death: ${artist.deathday}</p>
        // <p class="card-text">Hometown: ${artist.hometown}</p>
        // <p class="card-text">Nationality: ${artist.nationality}</p>
        // <p class="card-text">Location: ${artist.location}</p>

        // Add click event to the card
        // script.js

        artistCard.on('click', function() {
            const artistId = $(this).find('.card-body').data('artist-id');
        
            // Send AJAX request to backend endpoint (e.g., /artist/details)
            $.ajax({
                url: '/artist/details', // Replace with your actual endpoint
                type: 'GET', // Adjust method if needed (GET/POST)
                data: { artistId: artistId, 'size' : 10 }, // Send artist ID as data
                success: function(response) {
                    // Handle successful response from backend (e.g., redirect)
                    console.log('Artist details retrieved:', response);
                    // Replace with logic to redirect to artist details page
                    lastArtistPrinted = artistId;
                    window.location.href = `/artist/${artistId}`; // redirect
                },
                error: function(xhr, status, error) {
                    console.error('Error fetching artist details:', error);
                }
            });
        });
        
        // Append the artist card to the current row
        row.append(artistCard);

        // If the index is divisible by 3, end the current row and start a new one
        if ((index + 1) % 3 === 0) {
            artistsContainer.append(row);
            row = $('<div class="row"></div>');
        }
    });

    // Append the last row if it has any cards in it
    if (row.children().length > 0) {
        artistsContainer.append(row);
    }
}

<<<<<<< HEAD
// *****************************************************
// <!          Individual-Artwork-Ethan                  >
// *****************************************************
=======
async function fetchAndDisplayArtwork(artistname) {
    try {
      const artworkURL = `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&limit=20&fields=id,title,image_id`;
      const artworkData = await $.ajax({
        url: artworkURL,
        type: 'GET',
        headers: { 'X-XApp-Token': xAppToken },
        data: {
            msearch: artistname,
        }
      });
      // Assuming artworkData._embedded.artworks is an array of artwork objects
      artworkData.data.forEach(data => {

        const artworkItem = $(`
          <div class="col-md-3">
            <img src="https://www.artic.edu/iiif/2/${data.image_id}/full/843,/0/default.jpg" class="img-fluid" alt="${data.title}">
            <p>${data.title}</p>
          </div>
        `);
        $('#artworkRow').append(artworkItem);
      });
    } catch (error) {
      console.error('Error fetching artwork:', error);
    }
}
>>>>>>> main
