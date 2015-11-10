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

var params = getHashParams();
var access_token = params.access_token,
    state = params.state,
    storedState = localStorage.getItem(stateKey);
if (access_token && (state == null || state !== storedState)) {
  window.location = '/PlaySet/';
//  window.location = '';
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
    
    var green = "#b7e3b7",
        pink = "#efa2a2";
    var bgcolor = green;
        
    
    // AJAX methods using spotify authorization
    function ajaxGet(url) {
      return $.ajax({
        url: url,
        method: 'GET',
        headers: ajaxHeaders
      });
    };
    
    function ajaxPost(url, data) {
      console.log(data);
      return $.ajax({
        url: url,
        contentType: 'application/json',
        data: data,
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
    
    function createPlaylist(name) {
      ajaxPost('https://api.spotify.com/v1/users/' + user_id + '/playlists',
               {"name": name})
      .done()
      .fail( function(errorResponse) {
        console.log(errorResponse);
      });
    }
    
    function addTrack(trackID, playlistID) {
      var owner = myPlayGraph.playlists[playlistID].ownerID;
      var uri = myPlayGraph.tracks[trackID].uri;
      console.log("uri: " + uri);
      ajaxPost('https://api.spotify.com/v1/users/' + owner 
               + '/playlists/' + playlistID + '/tracks?uris=' + uri)
      .done( function(snapshot) {
        // update priority scores
        console.log(snapshot);
        myPlayGraph.addTrack(trackID, playlistID);
        myVennSets.addTrack(playlistID, trackID);
        updateChart();
      }).fail( function(errorResponse) {
        // Error code 403 for forbidden access if user is not authorized 
        // to add to playlist
        console.log(errorResponse);
      });
    }
    
    // Highlight a venn region in UI
    function renderRegion(selection, highlight) {
      var datum = selection.datum();
//      console.log("EVENT RECEIVED:");
//      console.log("datum: ");
//      console.log(datum);
//      console.log("highlight: " + highlight);
//      console.log("");
      var fillOpacity = (highlight ? 0.4 : (datum.selected ? 0.2 : 0)),
          strokeOpacity = ((datum.ids.length==1 && (highlight || !datum.selected)) || (datum.ids.length>1 && highlight && datum.selected) ? 1 : 0), 
          strokeWidth = ((datum.ids.length==1 && (highlight || !datum.selected)) || (datum.ids.length>1 && highlight && datum.selected) ? 1 : 0),
          strokeDashArray = (datum.selected ? "1, 0" : "1, 3");
      selection.transition().duration(250)
        .style("fill-opacity", fillOpacity)
        .style("stroke-opacity", strokeOpacity)
        .style("stroke-width", strokeWidth)
        .style("stroke-dasharray", strokeDashArray);
    };
    
    
    // Debounces external UI effects on drag events.
    function debounceDragEffects(status) {
      _.debounce(dragEffects, 250)(status);
    }
    
    // Performs external UI effects on drag events.
    function dragEffects(status) {
      if (status) {
        d3.select("body").transition().duration(250).style("background", "#efa2a2");
      } else {
        d3.select("body").transition().duration(250).style("background", "#b7e3b7");
      }
    }
    
    var dragTrack = null;
    var dragSets = {};
    
    function debounceSidebar() {
      _.debounce(updateSidebar, 1000)();
    }
    
    function updateSidebar() {
      sidebar.selectAll("li").remove();
      var tracks = (myVennSets.getPlaySet()).values();
      for (var i = 0, l = tracks.length; i < l; i++) {
        sidebar
          .datum(tracks[i])
          .append("li")
          .html(function(d, i) {
            var markup = "<div draggable='true' class='content'>";
            markup += myPlayGraph.tracks[d].name;
            markup += "<br> <span class='artist'>"
            markup += myPlayGraph.tracks[d].artists.join(", ");
            markup += "</span></div>"
            return markup;
          })
          .on("mouseover", function(d, i) {
            var ids = Object.keys(myPlayGraph.tracks[d].containingPlaylists);
            ids.forEach(function(element) {
              var selection = d3.select("#g" + myVennSets.playlistIndex(element)).select("path");
              renderRegion(selection, true);
            });
          })
          .on("mouseout", function(d, i) {
            var ids = Object.keys(myPlayGraph.tracks[d].containingPlaylists);
            ids.forEach(function(element) {
              var selection = d3.select("#g" + myVennSets.playlistIndex(element)).select("path");
              renderRegion(selection, false);
            });
          })
          .on("dragstart", function(d, i) {
//            console.log("Drag start, data: " + d);
            d3.event.dataTransfer.setData("trackID", d);
            d3.event.dataTransfer.effectAllowed = "copy";
            var dragImg = document.createElement('div');
            dragImg.setAttribute("class", "dragimg");
            dragImg.innerHTML = 'Add "' + myPlayGraph.tracks[d].name + '" to ...';
            document.body.appendChild(dragImg);
            d3.event.dataTransfer.setDragImage(dragImg, 0, 0);
            
            dragTrack = d;
            Object.keys(myPlayGraph.tracks[d].containingPlaylists).forEach(function(element) {
              dragSets[element] = 1;
            });
            debounceDragEffects(true);
          })
          .on("dragend", function() {
            dragTrack = null;
            debounceDragEffects(false);
            Object.keys(dragSets).forEach(function(element) {
              dragSets[element] = 0;
            });
          });
      }
      $("#sidebar").animate({ scrollTop: $("#sidebar")[0].scrollHeight}, 500);
//       PLAYBUTTON IFRAME UPDATE
      if (tracks.length > 0) {
        iframe
          .attr("src", "https://embed.spotify.com/?uri=spotify:trackset:PLAYSET:" + tracks.join(","));
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
        .style("fill", "white")
        .style("fill-opacity", function(d, i) { return (d.selected ? 0.2 : 0); })
        .style("stroke", "white")
        .style("stroke-opacity", function(d, i) { return (d.ids.length==1 && !d.selected) ? 1 : 0; })
        .style("stroke-width", function(d, i) { return d.ids.length == 1 && !d.selected ? 1 : 0; })
        .style("stroke-dasharray", function(d, i) { return d.selected ? "1, 0" : "1, 3"; });

      div.selectAll("g")
        .attr("id", function(d) { return "g" + d.index; })
        .on("mouseover", function (d, i) {
          // sort all the areas relative to the current item
          venn.sortAreas(div, d);

          // Display a tooltip with the current size
          tooltip.transition().duration(250).style("opacity", .8);
          tooltip.text(d.size + " track" + (d.size == 1 ? "" : "s"));

          // highlight the current path
          var selection = d3.select(this).select("path");
          renderRegion(selection, true);
        }).on("mousemove", function () {
          tooltip
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        }).on("mouseout", function (d, i) {
          tooltip.transition().duration(250).style("opacity", 0);
          var selection = d3.select(this).select("path");
          renderRegion(selection, false);
        }).on("click", function(d, i) {
          if (d.selected) {
            myVennSets.deselectSet(d.ids);
            var indices = myVennSets.getAllIndicesContaining(d.ids);
            indices.forEach(function(element) {
              var selection = d3.select("#g" + element).select("path");
              selection.datum(function(datum, i) {
                datum.selected = false;
                return datum;
              });
              renderRegion(selection, d.index==element);
            });
          } else {
            console.log(d.index);
            myVennSets.selectSet(d.ids);
            var indices = myVennSets.getAllIndicesContaining(d.ids);
            indices.forEach(function(element) {
              var selection = d3.select("#g" + element).select("path");
              selection.datum(function(datum, i) {
                datum.selected = true;
                return datum;
              });
              renderRegion(selection, d.index==element);
            });
          }
        debounceSidebar();
        })
        .on("dragenter", function(d, i) {
          var writeable = false;
          d.ids.forEach(function(element) {
            writeable = writeable || myPlayGraph.playlists[element].ownerID == user_id;
          });
          if (d.tracks.has(dragTrack) || !writeable)
            return;
          d3.event.preventDefault();
          console.log("Drag has entered");
          console.log(d.ids);
          d.ids.forEach(function(element) {
            if (!dragSets.hasOwnProperty(element))
              dragSets[element] = 1;
            else
              dragSets[element] += 1;
            if (myPlayGraph.playlists[element].ownerID == user_id) {
              var selection = d3.select("#g" + myVennSets.playlistIndex(element)).select("path");
              renderRegion(selection, true);
            }
          });
        })
        .on("dragover", function(d, i) {
          var writeable = false;
          d.ids.forEach(function(element) {
            writeable = writeable || myPlayGraph.playlists[element].ownerID == user_id;
          });
          if (d.tracks.has(dragTrack) || !writeable)
            return;
          d3.event.preventDefault();
          console.log("Drag is hovering");
        })
        .on("dragleave", function(d, i) {
          var writeable = false;
          d.ids.forEach(function(element) {
            writeable = writeable || myPlayGraph.playlists[element].ownerID == user_id;
          });
          if (d.tracks.has(dragTrack) || !writeable)
            return;
          d3.event.preventDefault();
          console.log("Drag has left");
          console.log(d.ids);
          d.ids.forEach(function(element) {
            dragSets[element] -= 1;
            if (dragSets[element] == 0) {
              var selection = d3.select("#g" + myVennSets.playlistIndex(element)).select("path");
              renderRegion(selection, false);
            }
          });
        })
        .on("drop", function(d, i) {
          var data = d3.event.dataTransfer.getData("trackID");
          console.log('Attempting to add "' + myPlayGraph.tracks[data].name + '" to ' + d.ids.map(
            function(el) {
              return myPlayGraph.playlists[el].name
            }).join(", "));
          d.ids.forEach(function(element) {
            if (!myPlayGraph.playlists[element].containedTracks.hasOwnProperty(data)
               && myPlayGraph.playlists[element].ownerID==user_id)
              addTrack(data, element);
          });
          d3.event.preventDefault();
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
      var action = myVennSets.addPlaylist(
        playlistID, 
        Object.keys(myPlayGraph.playlists[playlistID].containedTracks)
      );
      
      if (!action) return false;
      
      // UI-animations
      plusbtn.classed("hidden", true);
      setTimeout(function () { 
        plusbtn.classed("hidden", false);
      }, 500);
      
      updateChart();
      return true;
    }
    
    // Hide playlist on venn diagram.
    function hidePlaylist(playlistID) {
      var action = myVennSets.removePlaylist(playlistID);
      if (!action)
        return false; // can't remove last playlist
      updateChart();
//      if (!sidebar.selectAll("ul li").empty()) {
//        updateSidebar();
//      }
//      _.debounce(updateSidebar, 1000);
      debounceSidebar();
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
//    var client_id = '173e56dc6f4f4f7bac61397e362bd814'; // Your client id
    var redirect_uri = 'http://taichiaritomo.github.io/PlaySet/'; // Your redirect uri
//    var redirect_uri = 'http://127.0.0.1:49809/'; // Testing URI
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