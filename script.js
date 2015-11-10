
// Make the paper scope global, by injecting it into window:
paper.install(window);

window.onload = function() {

  /*************************** INITIAL CANVAS SETUP ****************************/

  // Setup directly from canvas id:
  paper.setup('myCanvas');

  //var path = new Path();
  //path.strokeColor = 'black'; // Give the stroke a color
  //var start = new Point(100, 100); // Move to start and draw a line from there
  //path.moveTo(start);
  //path.lineTo(start + [ 100, -50 ]); // Note the plus operator on Point objects.

  var myCircle1 = new Path.Circle(new Point(200, 200), 200);
  myCircle1.fillColor = 'black';

  var myCircle2 = new Path.Circle(new Point(400, 200), 200);
  myCircle2.fillColor = 'black';
  myCircle2.blendMode = 'xor';

  // Create a point-text item at {x: 30, y: 30}:
  var text1 = new PointText(new Point(100, 400));
  text1.fillColor = 'black';

  // Set the content of the text item:
  text1.content = 'Hello world';

  view.draw(); // method required to update canvas.
  


  /*********************** SPOTIFY API AUTHENTICATION ************************/

  var stateKey = 'spotify_auth_state';
  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }
  /**
   * Generates a random string containing numbers and letters
   * @param  {number} length The length of the string
   * @return {string} The generated string
   */
  function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };
  var userProfileSource = document.getElementById('user-profile-template').innerHTML,
      userProfileTemplate = Handlebars.compile(userProfileSource),
      userProfilePlaceholder = document.getElementById('user-profile'),

      oauthSource = document.getElementById('oauth-template').innerHTML,
      oauthTemplate = Handlebars.compile(oauthSource),
      oauthPlaceholder = document.getElementById('oauth'),

      playlistsSource = document.getElementById('playlists-template').innerHTML,
      playlistsTemplate = Handlebars.compile(playlistsSource),
      playlistsPlaceholder = document.getElementById('playlists'),

      playlist_1_Source = document.getElementById('playlist-open-1-template').innerHTML,
      playlist_1_Template = Handlebars.compile(playlist_1_Source),
      playlist_1_Placeholder = document.getElementById('playlist-open-1'),

      playlist_2_Source = document.getElementById('playlist-open-2-template').innerHTML,
      playlist_2_Template = Handlebars.compile(playlist_2_Source),
      playlist_2_Placeholder = document.getElementById('playlist-open-2');

  var params = getHashParams();
  var access_token = params.access_token,
      state = params.state,
      storedState = localStorage.getItem(stateKey);
  if (access_token && (state == null || state !== storedState)) {
    alert('There was an error during the authentication');
  } else {
    localStorage.removeItem(stateKey);
    if (access_token) {
      // GET User Profile Information
      $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          userProfilePlaceholder.innerHTML = userProfileTemplate(response);
          console.log(response);
          var user_id = response.id;
          console.log("User ID = " + user_id);
          $('#login').hide();
          $('#loggedin').show();

          // GET List of User's playlists.
          $.ajax({
            url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists',
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + access_token
            },
            success: function(pl) {
              console.log(pl);
              playlistsPlaceholder.innerHTML = playlistsTemplate(pl);

              // Graph containing all currently cached playlists and their contained
              // tracks and all currently cached tracks and their containing playlists.
              trackGraph = {
                playlists : {

                },
                /* Tracks are keyed by id (string), their values are an array of
                   playlist ids for the playlists that the track is a part of.
                   track_id : {
                     name:      name of track
                     paper_id : unique ID for represented paper item on canvas,
                     playlists: [ playlist_1_id, playlist_3_id ]
                   }
                */
                tracks : {
                }
              }
              
              /* playGraph hashes a playlistID to its Bubble.
                 a Bubble hashes a songID to a boolean indicating if the song is
                 inside the playlist to which the Bubble belongs.
              */
              var playGraph = [];
              
              // Method to get Playlist and add it to playGraph
              var getPlaylist = function(playlistID) {
                
              }

              // Get First Playlist
              $.ajax({
                url: 'https://api.spotify.com/v1/users/' + pl.items[0].owner.id + '/playlists/' + pl.items[0].id,
                method: 'GET',
                headers: {
                  'Authorization': 'Bearer ' + access_token
                },
                success: function(playlist) {
                  // FUNCTION TO RUN WHEN PLAYLIST IS RETRIEVED
                  playlist_1_Placeholder.innerHTML = playlist_1_Template(playlist);

                  for (i=0, l=playlist.tracks.items.length; i<l; i++) {
                    var track_id = playlist.tracks.items[i].track.id;
                    if (trackGraph.tracks[track_id]) {
                      trackGraph.tracks[track_id].playlists.push(playlist.id);
                    } else {
                      trackGraph.tracks[track_id] = {};
                      trackGraph.tracks[track_id].playlists = [playlist.id];
                      trackGraph.tracks[track_id].name      = playlist.tracks.items[i].track.name;
                    }
                  }

                  activePlaylists.push(playlist.id);
                  
                  // Get Second Playlist
                  $.ajax({
                    url: 'https://api.spotify.com/v1/users/' + pl.items[2].owner.id + '/playlists/' + pl.items[2].id,
                    method: 'GET',
                    headers: {
                      'Authorization': 'Bearer ' + access_token
                    },
                    success: function(playlist) {
                      // FUNCTION TO RUN WHEN PLAYLIST IS RETRIEVED
                      console.log(playlist);
                      console.log(playlist.tracks);
                      playlist_2_Placeholder.innerHTML = playlist_2_Template(playlist);

                      for (i=0, l=playlist.tracks.items.length; i<l; i++) {
                        var track_id = playlist.tracks.items[i].track.id;
                        if (trackGraph.tracks[track_id]) {
                          trackGraph.tracks[track_id].playlists.push(playlist.id);
                        } else {
                          trackGraph.tracks[track_id] = {};
                          trackGraph.tracks[track_id].playlists = [playlist.id];
                          trackGraph.tracks[track_id].name      = playlist.tracks.items[i].track.name;
                        }
                      }

                      activePlaylists.push(playlist.id);

                      var pl1X = 100,
                          pl2X = 300,
                          bothX = 200,
                          pl1Y=50,
                          pl2Y=20,
                          bothY=50;

                      for (var key in trackGraph.tracks) {
                        console.log(trackGraph.tracks[key].name);
                        console.log(trackGraph.tracks[key].playlists.length);
                        
                        if (trackGraph.tracks[key].playlists.length==1) {
                          if (trackGraph.tracks[key].playlists[0] == activePlaylists[0]) {
                            var trackText = new PointText(new Point(pl1X, pl1Y));
                            trackText.fillColor = 'white';
                            trackText.content = trackGraph.tracks[key].name;
                            trackGraph.tracks[key].paper_id = trackText.id;
                            pl1Y = pl1Y + 15;
                            view.draw()
                          } else {
                            var trackText = new PointText(new Point(pl2X, pl2Y));
                            trackText.fillColor = 'white';
                            trackText.content = trackGraph.tracks[key].name;
                            trackGraph.tracks[key].paper_id = trackText.id;
                            pl2Y = pl2Y + 15;
                            view.draw();
                          }
                        } else if (trackGraph.tracks[key].playlists.length==2) {
                          console.log("yo");
                          var trackText = new PointText(new Point(bothX, bothY));
                          trackText.fillColor = 'black';
                          trackText.content = trackGraph.tracks[key].name;
                          trackGraph.tracks[key].paper_id = trackText.id;
                          bothY = bothY + 15;
                          view.draw();
                        }

                      }

                      console.log(trackGraph.tracks);
                      text1.content = playlist.tracks.items[0].track.name;
                    }
                  });
                }
              });


            }
          }); // end playlists AJAX
        }
      }); // end userInfo AJAX
    } else { // login failed
        $('#login').show();
        $('#loggedin').hide();
    }
    document.getElementById('login-button').addEventListener('click', function() {
      var client_id = '173e56dc6f4f4f7bac61397e362bd814'; // Your client id
      var redirect_uri = 'http://127.0.0.1:53289/'; // Your redirect uri
      var state = generateRandomString(16);
      localStorage.setItem(stateKey, state);
      var scope = 'user-read-private playlist-read-collaborative';
      var url = 'https://accounts.spotify.com/authorize';
      url += '?response_type=token';
      url += '&client_id=' + encodeURIComponent(client_id);
      url += '&scope=' + encodeURIComponent(scope);
      url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
      url += '&state=' + encodeURIComponent(state);
      window.location = url;
    }, false);
  }

}