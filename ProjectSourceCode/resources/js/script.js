// Define the client ID and client secret
const clientId = '1d9b8e671ea91dec007a';
const clientSecret = 'b6217bab761f9c4b323fca431ac61596';

// Function to fetch X-App-Token from Artsy API
function fetchXAppToken() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: `https://api.artsy.net/api/tokens/xapp_token?client_id=${clientId}&client_secret=${clientSecret}`,
            type: 'GET',
            success: function(response) {
                const xAppToken = response.token;
                console.log('X-App-Token:', xAppToken); // Log the obtained token
                resolve(xAppToken);
            },
            error: function(xhr, status, error) {
                reject(error);
            }
        });
    });
}


// Function to fetch artists by gene from Artsy API
async function fetchArtistsByGene(geneNames) {
    try {
        const xAppToken = await fetchXAppToken();
        for (const geneName of geneNames) {
            console.log('Fetching artists for gene:', geneName); // Log the gene being fetched
            const response = await $.ajax({
                url: `https://api.artsy.net/api/genes/${geneName}`,
                type: 'GET',
                headers: {
                    'X-Xapp-Token': xAppToken
                }
            });
            console.log('Artists for gene', geneName, ':', response); // Log the fetched artists
            displayArtists(response);
        }
    } catch (error) {
        console.error('Error fetching X-App-Token or artists:', error);
    }
}


// Function to display artists in the DOM
function displayArtists(artists) {
    // Assuming there's a container with id "artistsContainer" in your HTML
    var artistsContainer = $('#artistsContainer');
    
    // Clear existing content
    artistsContainer.empty();
    
    // Loop through each artist and create HTML elements to display them
    artists.forEach(function(artist) {
        var artistCard = `
            <div class="card rounded mb-3">
                <img src="${artist.image}" class="card-img-top" alt="${artist.name}">
                <div class="card-body">
                    <h5 class="card-title">${artist.name}</h5>
                    <!-- Add more artist information here as needed -->
                </div>
            </div>
        `;
        artistsContainer.append(artistCard);
    });
}

// Example usage: Fetch artists of a certain gene when the page loads
$(document).ready(function() {
    var geneNames = ['pop-art', 'renaissance']; // Replace with the desired gene names
    fetchArtistsByGene(geneNames);
});
