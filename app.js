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
//var userProfileSource = document.getElementById('user-profile-template').innerHTML,
//    userProfileTemplate = Handlebars.compile(userProfileSource),
//    userProfilePlaceholder = document.getElementById('user-profile'),
//
//    oauthSource = document.getElementById('oauth-template').innerHTML,
//    oauthTemplate = Handlebars.compile(oauthSource),
//    oauthPlaceholder = document.getElementById('oauth'),
//
//    playlistsSource = document.getElementById('playlists-template').innerHTML,
//    playlistsTemplate = Handlebars.compile(playlistsSource),
//    playlistsPlaceholder = document.getElementById('playlists');

//
//      playlist_1_Source = document.getElementById('playlist-open-1-template').innerHTML,
//      playlist_1_Template = Handlebars.compile(playlist_1_Source),
//      playlist_1_Placeholder = document.getElementById('playlist-open-1'),
//
//      playlist_2_Source = document.getElementById('playlist-open-2-template').innerHTML,
//      playlist_2_Template = Handlebars.compile(playlist_2_Source),
//      playlist_2_Placeholder = document.getElementById('playlist-open-2');

var params = getHashParams();
var access_token = params.access_token,
    state = params.state,
    storedState = localStorage.getItem(stateKey);
if (access_token && (state == null || state !== storedState)) {
  window.location = '/index.html';
  console.log('Access token reset');
} else {
  localStorage.removeItem(stateKey);
  if (access_token) {
    $('#login').hide();
    $('#loggedin').show();
    
    var user_id,
        ajaxHeaders = { 'Authorization': 'Bearer ' + access_token };

    var myPlayGraph,          // PlayGraph object...graph of tracks and playlists
        myVennSets,           // VennSets object...generates venn diagram data
        chart = venn.VennDiagram()
                      .duration(500)
                      .width(window.innerWidth - 250)
                      .height(window.innerHeight),
//        playSet,              // the queried set of tracks to play
//        activeSets = {},      // Hashes playlistID to playlists as d3 sets of trackIDs
//        playlistScore = {},   // Hashes playlistIDs to priority score
        maxActive = 8;        // maximum number of activePlaylists
    
    
    var div = d3.select("#venn"),
        plusbtn = d3.select("#plus-btn"),
        menu = d3.select("#menu"),
        sidebar = d3.select("#sidebar ul"),
        iframe = d3.select("#playbutton");
        
    
    // AJAX methods using spotify authorization
    function ajaxGet(url) {
      return $.ajax({
        url: url,
        method: 'GET',
        headers: ajaxHeaders
      });
    };
    
    function ajaxPost(url) {
      return $.ajax({
        url: url,
        method: 'POST',
        headers: ajaxHeaders
      });
    }
    
    function ajaxDelete(url) {
      return $.ajax({
        url: url,
        method: 'DELETE',
        headers: ajaxHeaders
      });
    }
    
    
    // Spotify API methods
    function getPlaylists() {
      return ajaxGet('https://api.spotify.com/v1/users/' + user_id
                     + '/playlists');
    }
    
    function getPlaylist(ownerID, playlistID) {
      return ajaxGet('https://api.spotify.com/v1/users/' + ownerID
                     + '/playlists/' + playlistID);
    }
    
    function addTrack(trackID, playlistID) {
      var owner = myPlayGraph.playlists[playlistID].ownerID;
      var uri = myPlayGraph.tracks[trackID].uri;
      ajaxPost('https://api.spotify.com/vi/users/' + owner 
               + '/playlists/' + playlistID + '/tracks/uris=' + uri)
      .done( function(snapshot) {
        // update priority scores
        // update PlayGraph
        // update VennSets object
      }).fail( function(errorResponse) {
        // Error code 403 for forbidden access if user is not authorized 
        // to add to playlist
        window.alert(errorResponse);
      });
    }
    
    
    function updateSidebar() {
      sidebar.selectAll("li").remove();
      var tracks = (myVennSets.getPlaySet()).values();
      for (var i = 0, l = tracks.length; i < l; i++) {
        sidebar
          .datum(tracks[i])
          .append("li")
          .html(function(d, i) {
            var markup = "";
            markup += myPlayGraph.tracks[d].name;
            markup += "<br> <span class='artist'>"
            markup += myPlayGraph.tracks[d].artists.join(",");
            markup += "</span>"
            return markup;
          })
          .on("mouseover", function(d, i) {
            var ids = Object.keys(myPlayGraph.tracks[d].containingPlaylists);
            ids.forEach(function(element) {
              d3.select("#g" + myVennSets.playlistIndex(element)).select("path")
                .transition().duration(250)
                .style("stroke-width", 2)
                .style("stroke-opacity", 1)
                .style("fill-opacity", 0.4);
            });
          })
          .on("mouseout", function(d, i) {
            var ids = Object.keys(myPlayGraph.tracks[d].containingPlaylists);
            ids.forEach(function(element) {
              d3.select("#g" + myVennSets.playlistIndex(element)).select("path")
                .transition().duration(250)
                .style("stroke-width", 0)
                .style("stroke-opacity", 0)
                .style("fill-opacity", 0.25);
            });
          });
      }
//       PLAYBUTTON IFRAME UPDATE
      if (tracks.length > 0) {
        iframe
          .attr("src", "https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:" + tracks.join(","));
      } else {
        iframe
          .attr("src", "");
      }
    }
    
    
    // Update Venn Diagram
    function updateChart() {
      var data = myVennSets.getVennData();
      for (var j = 0; j < data.length; j++) {
        data[j].sets = data[j].ids.map(function (id) {
          return myPlayGraph.playlists[id].name;
        });
      }
      div.datum(data).call(chart);
      
      var tooltip = d3.select("body").append("div").attr("class", "venntooltip");

      div.selectAll("path")
        .style("stroke-opacity", 0)
        .style("stroke", "#fff")
        .style("stroke-width", 0)
        .style("fill", function(d, i) {
          return d.selected ? "white" : "gray";
        })
        .style("fill-opacity", function(d, i) {
          return 0.125 + d.ids.length/maxActive*0.5;
        });

      div.selectAll("g")
        .attr("id", function(d) { return "g" + d.index; })
        .on("mouseover", function (d, i) {
          // sort all the areas relative to the current item
          venn.sortAreas(div, d);

          // Display a tooltip with the current size
          tooltip.transition().duration(250).style("opacity", .8);
          tooltip.text(d.size + " track" + (d.size == 1 ? "" : "s"));

          // highlight the current path
          var selection = d3.select(this).transition("tooltip").duration(250);
          selection.select("path")
            .style("stroke-width", 2)
            .style("fill-opacity", d.sets.length == 1 ? .4 : .4)
            .style("stroke-opacity", 1);
        }).on("mousemove", function () {
          tooltip
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        }).on("mouseout", function (d, i) {
          tooltip.transition().duration(250).style("opacity", 0);
          var selection = d3.select(this).transition("tooltip").duration(250);
          selection.select("path")
            .style("stroke-width", 0)
            .style("fill-opacity", 0.125 + d.ids.length/maxActive*0.5)
//            .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
            .style("stroke-opacity", 0);
        }).on("click", function(d, i) {
          if (d.selected) {
            myVennSets.deselectSet(d.ids);
            
            var indices = myVennSets.getAllIndicesContaining(d.ids);
            indices.forEach(function(element) {
              div.selectAll("#g" + element)
                .datum(function(data2, i) {
                  data2.selected = false;
                  return data2;
                })
                .select("path").style("fill", "gray")
                .style("fill-opacity", 0.125 + d.ids.length/maxActive*0.5);
            });
          } else {
            myVennSets.selectSet(d.ids);
            var indices = myVennSets.getAllIndicesContaining(d.ids);
            indices.forEach(function(element) {
              div.selectAll("#g" + element)
                .datum(function(data2, i) {
                  data2.selected = true;
                  return data2;
                })
                .select("path")
                .style("fill", "white")
                .style("fill-opacity", 0.125 + d.ids.length/maxActive*0.5);
            });
          }
          updateSidebar();
        })
        .selectAll("text").style("fill", "white");
    }
    
    function resizeChart() {
      chart = venn.VennDiagram()
                     .duration(500)
                     .width(window.innerWidth - 250)
                     .height(window.innerHeight);
      updateChart();
    }
    
    
    // Show playlist on venn diagram. Update data with new API call.
    function showPlaylist(playlistID) {
      myVennSets.addPlaylist(
        playlistID, 
        Object.keys(myPlayGraph.playlists[playlistID].containedTracks)
      );
      
      // UI-animations
      plusbtn.classed("hidden", true);
      setTimeout(function () { 
        plusbtn.classed("hidden", false);
      }, 500);
      
      updateChart();
    }
    
    // Hide playlist on venn diagram.
    function hidePlaylist(playlistID) {
      var action = myVennSets.removePlaylist(playlistID);
      if (!action)
        return false; // can't remove last playlist
      updateChart();
      if (!sidebar.selectAll("ul li").empty()) {
        updateSidebar();
      }
      return true;
    }
    
    // Toggle playlist on venn diagram.
    function togglePlaylist(playlistID) {
      if (myVennSets.containsPlaylist(playlistID)) {
        return hidePlaylist(playlistID);
      } else {
        showPlaylist(playlistID);
        return true;
      }
    }
    
    
    /***************** INITIALIZE APP *****************/
    
    // GET User Profile Information to test API.
    ajaxGet('https://api.spotify.com/v1/me')
    .done( function(response) {
//      userProfilePlaceholder.innerHTML = userProfileTemplate(response);
      console.log(response);
      user_id = response.id;
      console.log("User ID = " + user_id);
      
      
      // Initialize PlayGraph
      getPlaylists().done( function(spotifyPlaylistsObject) {
//        console.log(spotifyPlaylistsObject);
        
        myPlayGraph = new PlayGraph();
        var promises = [];
        for (var i = 0, l = spotifyPlaylistsObject.items.length; i < l; i++) {
          var simplePL = spotifyPlaylistsObject.items[i];
          promises.push(
            getPlaylist(simplePL.owner.id, simplePL.id)
            .done( function(spotifyPlaylistObject) {
              myPlayGraph.addPlaylist(spotifyPlaylistObject);
            })
            .fail( function(errorResponse) {
              window.alert(errorResponse);
            })
          );
        }
        
        // When all getPlaylist AJAX responses are received:
        $.when.apply(null, promises).done( function() {
          
          // Initialize VennSets and visualization
          var slice = Object.keys(myPlayGraph.playlists).slice(0, maxActive);
          var vsInput = {};
          for (var j = 0; j < slice.length; j++) {
            var id = slice[j];
            vsInput[id] = Object.keys(myPlayGraph.playlists[id].containedTracks);
          }
          myVennSets = new VennSets(vsInput);
          updateChart();
          

          // Initialize menu
          var ul = d3.select("#menu ul");
          var playlistIDs = Object.keys(myPlayGraph.playlists);
          for (var i = 0, l = playlistIDs.length; i < l; i++) {
            ul.datum(playlistIDs[i])
              .append("li")
              .classed("selected", true)
              .html(function (d, i) { return myPlayGraph.playlists[d].name; })
              .on("click", function (d, i) {
                if (togglePlaylist(d))
                d3.select(this).classed("selected", !d3.select(this).classed("selected"));
              });
          }
          
          updateSidebar();
          
          $(window).resize(_.debounce(resizeChart, 400));
          
          d3.select("#plus-btn").on("click", function(d, i) {
            menu.classed("closed", !menu.classed("closed"));
            plusbtn.classed("rotated", !plusbtn.classed("rotated"));
          });
          
          
          
          
          
          
          
          

          // Initialize priority score data structures
//          for (playlistID in Object.keys(myPlayGraph.playlists)) {
//            playlistScore[playlistID] = 1;
//          }
        });
      }).fail( function(errorResponse) {
        window.alert(errorResponse);
      });
    });
    
  } else { // login failed
      $('#login').show();
      $('#loggedin').hide();
  }
  document.getElementById('login-button').addEventListener('click', function() {
    var client_id = '173e56dc6f4f4f7bac61397e362bd814'; // Your client id
    var redirect_uri = 'http://127.0.0.1:60220/'; // Your redirect uri
    var state = generateRandomString(16);
    localStorage.setItem(stateKey, state);
    var scope = 'user-read-private user-library-read playlist-modify-public playlist-read-collaborative playlist-modify-private';
    var url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(client_id);
    url += '&scope=' + encodeURIComponent(scope);
    url += '&redirect_uri=' + encodeURIComponent(redirect_uri);
    url += '&state=' + encodeURIComponent(state);
    window.location = url;
  }, false);
}