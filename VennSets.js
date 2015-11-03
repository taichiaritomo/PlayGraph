// VennSets constructor takes an object that hashes playlistIDs to array of trackIDs
function VennSets(playlists) {
  var maxActive = 8; // maximum number of activePlaylists
  
  if (Object.keys(playlists).length > this.maxActive) {
    console.log("Too many playlists for VennSets constructor");
    return;
  }
  
  // Digits are used to build a binary number, where each digit in the binary
  // number corresponds to a set. The final binary number represents the set 
  // intersection of the sets whose digits are 1.
  var emptyDigits = [];
  for (var i = maxActive - 1; i >= 0; i--) {
    emptyDigits.push(i);
  }
  
  // playlistDigit[playlistID] -> Digit corresponding to the playlist
  var playlistDigit = {};
  
  var numActive = function() {
    return maxActive - emptyDigits.length;
  }

  // An array of playlistSet objects, indexed by their getSetIndex number
  var setIntersections = [];

  // Returns the index of the intersection-set of the inputed playlists.
  // Input: an array of playlistIDs.
  var getSetIndex = function(ids) {
    var index = 0;
    for (var i = 0; i < ids.length; i++) {
      index += Math.pow(2, playlistDigit[ids[i]]);
    }
    return index;
  }
  
  // Returns index of intersection of playlists,
  // Input: playlistID
  this.playlistIndex = function(p) {
    return getSetIndex([p]);
  }
  
  // method returns all numbers for which the binary conversion has a set of
  // digits fixed to 1, given by the array 'fixed', while the digits fo the
  // binary number specified in the array a can be either 0 or 1.
  // digits are counted from the right, starting with 0.
  // if a is sorted ascending, the final result will also be sorted.
  var binaryPermute = function(fixed, a) {
    if (a.length == 0) {
      return [fixed.reduce(function(x, y) {
        return x + Math.pow(2, y);
      }, 0)];
    } else {
      var current = a.pop();
      var recurse = binaryPermute(fixed, a);
      return recurse.concat(recurse.map(function(item) { 
        return item + Math.pow(2, current);
      }));
    }
  }
  
  // Returns all indices for sets involving the indicated playlists
  // Input: an array of playlistIDs
  var getAllIndicesContaining = function(p) {
    var fixed = p.map(function(x) { return playlistDigit[x]; });
    var a = [];
    for (var key in playlistDigit) {
      if (playlistDigit.hasOwnProperty(key) && p.indexOf(key) < 0) {
        a.push(playlistDigit[key]);
      }
    }
    a.sort(function(a, b) { return a-b; });
    return binaryPermute(fixed, a);
  }
  
  this.getAllIndicesContaining = function(p) {
    return getAllIndicesContaining(p);
  }
  
  
  // Returns boolean representing existence of playlist
  this.containsPlaylist = function(p) {
    return playlistDigit.hasOwnProperty(p);
  }

  
  // Adds playlist to VennSets
  // Input: playlistID and array of trackIDs
  this.addPlaylist = function(p, t) {
    if (emptyDigits.length == 0) {
      console.log("Active playlist limit reached!");
      return;
    }
    
    // assign empty digit to playlist from the right side of the emptyDigit array.
    playlistDigit[p] = emptyDigits.pop();
    console.log("Adding playlist " + playlistDigit[p]);
    console.log("Empty Digits: " + emptyDigits.join(", "));
    
    var tracks = d3.set(t);
    
    var keys = Object.keys(setIntersections);
    keys.forEach(function(key) {
      var element = setIntersections[key];
      var pl = element.ids.concat([p]);
      setIntersections[getSetIndex(pl)] = {
        set : intersect([element.set, tracks]),
        ids : pl,
        selected : element.selected
      };
    });

    // add current set into setIntersections[]
    setIntersections[getSetIndex([p])] = {
      set : tracks,
      ids : [p],
      selected : false
    };
    console.log("");
  }
  
   
  // Removes playlist from VennSets
  // Input: playlistID, Returns success.
  this.removePlaylist = function(p) {
    if (emptyDigits.length == maxActive - 1) {
      console.log("Can't hide all playlists!");
      return false;
    }
    
    console.log("Hiding playlist " + playlistDigit[p]);
    
    var index = getSetIndex([p]);
    var indices = getAllIndicesContaining([p]);
    
    // remove every setIntersections entry that involves playlist, mark songs that
    // are only in playlist for removal from playSet.
    var subtract = d3.set(setIntersections[index].set.values());
    
    for (var i = 0; i < indices.length; i++) {
      if (indices[i] != index)
        subtract = difference(subtract, setIntersections[indices[i]].set);
      delete setIntersections[indices[i]];
    }
    
    playSet = difference(playSet, subtract);
    
//    console.log("setIntersections after removal");
//    console.log(setIntersections);
    
    // reset digit availability
    var digit = playlistDigit[p];
    delete playlistDigit[p];
    emptyDigits.push(digit);    
//    console.log("Empty Digits: " + emptyDigits.join(", "));
//    console.log("Removing indices: " + indices.join(", "));
//    console.log("");
    
    return true;
  }
  
  
  // Adds track to VennSets
  // Input: playlistID and trackID
  this.addTrack = function(playlistID, trackID) {
    setIntersections[getSetIndex([playlistID])].set.add(trackID);
    for (var s in setIntersections) {
      var x = setIntersections[s];
      if (!x.ids.hasOwnProperty(playlistID) && x.set.has(trackID)) {
        var index = getSetIndex(x.ids.concat([playlistID]));
        setIntersections[index].set.add(trackID);
      }
    }
  }
  
  
  // Removes track from VennSets
  this.removeTrack = function(playlistID, trackID) {
    var indices = getAllIndicesContaining([playlistID]);
    for (var i = 0; i < indices.length; i++) {
      setIntersections[i].set.remove(trackID);
    }
  }
  
  
  var playSet = d3.set([]);
  
  // Selects the region defined by the intersection of playlists,
  // and all regions inside that region. 
  // Input: an array of playlistIDs
  this.selectSet = function(p) {
    console.log("Given playlistIDs: " + p.join(", "));
    var indices = getAllIndicesContaining(p);
    console.log("indices changed are " + indices.join(", "));
    indices.forEach(function(x) {
      setIntersections[x].selected = true;
    });
    var index = getSetIndex(p);
    playSet = union([playSet, setIntersections[index].set]);
  }
  
  // Deselects the region defined by the intersection of playlists
  // and all regions inside that region.
  // Input: an array of playlistIDs
  this.deselectSet = function(p) {
    var indices = getAllIndicesContaining(p);
    
    indices.forEach(function(x) {
      setIntersections[x].selected = false;
    });
    var index = getSetIndex(p);
    playSet = difference(playSet, setIntersections[index].set);
  }
  
  // Return playSet
  this.getPlaySet = function() {
    return playSet;
  }
  
  
  // Colors array
//  var colors = ["red", "orange", "blue", "green", "purple", 
  
  
  // Returns Data used by venn.js
  this.getVennData = function() {
    var data = [];
    setIntersections.forEach( function(element, index, array) {
      var sz = element.set.size();
      data.push({
        ids: element.ids,
        index: index,
        size: sz,
        selected : element.selected,
        tracks: element.set
      });
    });
    return data;
  }
  
  
  // Initialize each playlist
  for (var key in playlists) {
    if (!playlists.hasOwnProperty(key)) {
      continue;
    }
    this.addPlaylist(key, playlists[key]);
    this.selectSet([key]);
  }
}