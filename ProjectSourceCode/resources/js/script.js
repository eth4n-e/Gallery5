const xAppToken = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6IiIsInN1YmplY3RfYXBwbGljYXRpb24iOiIyZGRmN2VkOC1mZTAyLTQxN2YtYTM2Ni03NGE2NTg4NWNlODgiLCJleHAiOjE3MTM1Nzc0OTcsImlhdCI6MTcxMjk3MjY5NywiYXVkIjoiMmRkZjdlZDgtZmUwMi00MTdmLWEzNjYtNzRhNjU4ODVjZTg4IiwiaXNzIjoiR3Jhdml0eSIsImp0aSI6IjY2MTllMzk5ZmFlNWRkMDAwYjc1NzVhNyJ9.nv4SH0J6wRAOH1w5K8W3B-YmleyseJZQcIgLzcLm1TA';


// Function to fetch artists by gene from Artsy API
// Function to fetch artists by gene from Artsy API
async function fetchArtistsByGene(geneNames) {
    try {
        for (const geneName of geneNames) {
            console.log('Fetching artists for gene:', geneName); // Log the gene being fetched
            geneURL = 'https://api.artsy.net/api/genes/' + geneName;
            const response = await $.ajax({
                url: geneURL,
                type: 'GET',
                headers: {
                    'X-XApp-Token': xAppToken
                }
            });
            console.log('Artists for gene', geneName, ':', response.name); // Log the fetched artists
            if (!response._links.artists.href) {
                console.log('Bad Href');
            } else {
                const artistsData = await $.ajax({ // Fetch artists data
                    url: response._links.artists.href,
                    type: 'GET',
                    headers: {
                        'X-XApp-Token': xAppToken
                    }
                });
                if (!artistsData) {
                    console.log('Error finding artists at: ' + response._links.artists.href);
                }
                const artistArray = [];
                for (const artist of artistsData._embedded.artists) {
                    artistArray.push(artist);
                    console.log(artist);
                }
                // displayGeneInfo(response);
                displayArtists(artistArray); // Display artists
            }
        }
    } catch (error) {
        console.error('Error fetching X-App-Token or artists:', error);
    }
}

// function displayGeneInfo(response) {
//     const template = Handlebars.compile(`
//       <div class="row">
//         <div class="col-md-12 mb-3">
//           <div class="card bg-light">
//             <div class="card-body">
//               <h2 class="card-title">{{name}}</h2>
//               <p class="card-text">{{description}}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     `);
  
//     const html = template(response);
//     $("#artistsContainer").before(html);
//   }
  

function displayArtists(artistArray) {
    // Assuming there's a container with id "artistsContainer" in your HTML
    var artistsContainer = $('#artistsContainer');

    // Start a new row
    var row = $('<div class="row"></div>');

    // Loop through each artist and create HTML elements to display them
    artistArray.forEach(function(artist, index) {
        // Create HTML element to display the artist
        var artistCard = `
            <div class="col-md-4">
                <div class="card rounded mb-3">
                    <img src="${artist._links.thumbnail.href}" class="card-img-top" alt="${artist.name}">
                    <div class="card-body">
                        <h5 class="card-title">${artist.name}</h5>
                        <p class="card-text">Birthday: ${artist.birthday} Death: ${artist.deathday}</p>
                        <p class="card-text">Hometown: ${artist.hometown}</p>
                        <p class="card-text">Nationality: ${artist.nationality}</p>
                        <p class="card-text">Location: ${artist.location}</p>
                        <!-- Add more artist information here as needed -->
                    </div>
                </div>
            </div>
        `;

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

