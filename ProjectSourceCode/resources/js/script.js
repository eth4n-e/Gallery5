var page = 1;

function getArtistThumb(artistName) {
  const wikiURL = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|extracts&titles=${artistName}&origin=*&pithumbsize=100`;
  
  return fetch(wikiURL)
    .then(response => response.json())
    .then(data => {
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      const artistInfo = pages[pageId];
      return {
        thumbnail: artistInfo.thumbnail ? artistInfo.thumbnail.source : null,
        name: artistInfo.title // Assuming you also want to return the artist's name
      };
    })
    .catch(error => {
      console.error(`Error retrieving data from Wikipedia for: ${artistName}`, error);
      return null;
    });
}

async function displayRelatedArtists(artistName) {
  try {
    const artistURL = `https://api.artic.edu/api/v1/artists/search?query=${artistName}&limit=25`;
    const response = await fetch(artistURL);
    const artistsData = await response.json();
    const artists = artistsData.data; // Assuming this is where the artists array is located

    // Clear the similarArtistsContainer before adding new cards
    const similarArtistsContainer = document.getElementById('similarArtistsRow');
    similarArtistsContainer.innerHTML = '';

    // Loop through the artists and create a Bootstrap card for each
    for (const artist of artists) {
      const artistThumb = await getArtistThumb(artist.title);
      if (artistThumb && artistThumb.thumbnail) {
        const cardHtml = `
          <div class="col-md-3 mt-3">
            <div class="artist-card shadow-sm position-relative" data-artistID="${artist.id} ">
              <img src="${artistThumb.thumbnail}" class="card-img-top" alt="${artistThumb.name}">
              <div class="card-body">
                <p class="card-text">${artistThumb.name}</p>
              </div>
            </div>
          </div>
        `;
        similarArtistsContainer.innerHTML += cardHtml; // Append the card to the container
      }
    }
  } catch (error) {
    console.error(`Error fetching artists related to ${artistName}`, error);
  }
}
  
async function fetchAndDisplayArtwork(artistname) {
  try {
    const artworkURL = `https://api.artic.edu/api/v1/artworks/search?query[term][is_public_domain]=true&limit=50&fields=id,title,image_id`;
    const artworkData = await $.ajax({
      url: artworkURL,
      type: 'GET',
      data: {
          q: artistname,
      }
    });
    let isEmpty = 1;
    // Assuming artworkData.data is an array of artwork objects
    artworkData.data.forEach(data => {
      if(data.image_id != null){
      const artworkItem = `
        <div class="col-md-3 mb-4 shadow-sm">
          <div class="artwork-card" data-artworkID="${data.id}" id="artwork-card">
            <img src="https://www.artic.edu/iiif/2/${data.image_id}/full/400,/0/default.jpg" class="card-img-top img-fluid" alt="${data.title}">
            <div class="card-body">
              <p class="card-text">${data.title}</p>
            </div>
          </div>
        </div>
      `;
      isEmpty =0;
      $('#artworkRow').append(artworkItem);
      }
    });
    if(isEmpty==1){
      const artworkFailed = `
      <div class="container-fluid">
        <h5>No related artworks found in the public domain.</h5>
      </div>`;
      $('#artworkRow').append(artworkFailed);
    }
  } catch (error) {
    console.error('Error fetching artwork:', error);
  }
}

async function fetchMoreArtists() {
  try {
      page++; // Increment the global page variable
      const artistData = await fetch(`https://api.artic.edu/api/v1/artists?limit=100&page=${page}`);
      const json = await artistData.json();

      const container = document.querySelector('#artistContainer');
      container.innerHTML = ''; // Clear the container before adding new artists

      for (const data of json.data) {
          const artistThumb = await getArtistThumb(data.title);
          if (artistThumb && artistThumb.thumbnail) {
              const artistCard = document.createElement('div');
              artistCard.classList.add('card', 'mb-3');

              artistCard.innerHTML = `
                <div class="col-md-3 mt-3 mb-4"> 
                  <div class="artist-card mb-4 position-relative shadow-sm" data-artistID="${data.id}">
                    <img src="${artistThumb.thumbnail}" class="bd-placeholder-img card-img-top fluid" alt="${artistThumb.name}">
                      <div class="follow-button position-absolute bottom-0 end-0">
                        <img src="../../../resources/images/follow_button.png" alt="Follow" class="img-fluid" style="height: 12px; width: auto;">
                      </div>
                      <div class="card-body">
                        <h5 class="card-title">${data.title}</h5>
                        <p class="card-text">Artist ID: ${data.id}</p>
                      </div>
                  </div>
                </div>
              `;
              container.appendChild(artistCard);
          }
      }
  } catch (error) {
      console.error('Error fetching more artists:', error);
  }
}

// const followButton = document.querySelector('.add-to-list'); // Assuming a reference to the button

// followButton.addEventListener('click', async () => {
//     const artistId = followButton.closest('.artist-card').dataset.artistid;
//     try {
//         const response = await fetch(`/api/follow/${artistId}`, {
//             method: 'POST'
//         });
//         if (response.ok) {
//             // Update UI to reflect following (e.g., change button text)
//             console.log('followed!');
//             followButton.textContent = 'Followed';
//             followButton.classList.add('followed'); // Add a class for styling
//         } else {
//             console.error('Failed to follow artist:', await response.text());
//             // Handle error (e.g., display user-friendly message)
//         }
//     } catch (error) {
//         console.error('Error following artist:', error);
//         // Handle error (e.g., display user-friendly message)
//     }
// });


// async function checkFollowing(artistId) {
//   // Example 1: Using local storage (assuming a "following" key with artist IDs)
//   // const following = localStorage.getItem('following') || [];
//   // return following.includes(artistId.toString());

//   // Example 2: Using a backend API call (replace with your actual API logic)
//   const isFollowing = await fetch(`/api/user/following/${artistId}`);
//   return response.ok; // Assuming successful response indicates following
// }


// const express = require('express');
// const router = express.Router();

// // POST endpoint to add an artist to the user's follow list
// router.post('/followArtist', (req, res) => {
//   const userId = req.body.userId;
//   const artistId = req.body.artistId;

//   addUserArtist(userId, artistId)
//     .then(() => {
//       res.status(200).send('Artist successfully followed');
//     })
//     .catch(err => {
//       res.status(500).send('Error following artist');
//     });
// });

// module.exports = router;