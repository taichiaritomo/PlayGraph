// PlayGraph's track object
// Input: Spotify Track Object
function TrackNode(spotifyTrackObject) {
  this.artists = spotifyTrackObject.artists.map(function(element) {
    return element.name;
  }); // array of spotify Artist Objects
  this.albumArt = spotifyTrackObject.album.images[0].url; // smallest image for album
  this.containingPlaylists = {}; // this.containingPlaylists[\ownerID][\playlistID] -> playlistNode
  this.id = spotifyTrackObject.id;
  this.name = spotifyTrackObject.name;
  this.uri = spotifyTrackObject.uri;
}

// PlayGraph's playlist object
// Input: Spotify Playlist Object
function PlaylistNode(spotifyPlaylistObject) {
  this.containedTracks = {}; //this.containedTracks[trackID] -> trackNode
  this.image = spotifyPlaylistObject.images[0].url; // smallest image for playlist
  this.name = spotifyPlaylistObject.name;
  this.ownerID = spotifyPlaylistObject.owner.id;
  for (var i = 0; i < spotifyPlaylistObject.tracks.items.length; i++) {
    var t = spotifyPlaylistObject.tracks.items[0].track;
    this.containedTracks = {};
  }
}

// UNTESTED - WIP
// Input: Spotify Playlists Object
function PlayGraph() {
  this.tracks = {};    //this.tracks[\trackID] -> trackNode
  this.playlists = {}; //this.playlists[\ownerID][\playlistID] -> playlistNode
}

PlayGraph.prototype = {
  addPlaylist : function(spotifyPlaylistObject) {
    var playlistID = spotifyPlaylistObject.id;
    var playlistNode = new PlaylistNode(spotifyPlaylistObject);
    this.playlists[playlistID] = playlistNode;
    
    for (var i = 0; i < spotifyPlaylistObject.tracks.items.length; i++) {
      var trackID = spotifyPlaylistObject.tracks.items[i].track.id;
      // if trackNode doesn't already exist create new trackNode with playlistNode reference
      if (!this.tracks[trackID])
        this.tracks[trackID] = new TrackNode(spotifyPlaylistObject.tracks.items[i].track);
      this.tracks[trackID].containingPlaylists[playlistID] = playlistNode;
      playlistNode.containedTracks[trackID] = this.tracks[trackID];
    }
  },
  
  // USED ON PLAYLISTS BEFORE THEY ARE UPDATED
  removePlaylist : function(playlistID) {
    var tracks = this.playlists[playlistID].containedTracks;
    for (var id in Object.keys(tracks)) {
      var cP = this.tracks[id].containingPlaylists;
      delete cP[playlistID];
      if (Object.keys(cP).length == 0) delete this.tracks[id];
    }
    this.playlists[playlistID] = undefined; // will be replaced soon by addPlaylist
  },
    
  addTrack : function(spotifyTrackObject) {
    this.tracks[trackID] = new TrackNode(spotifyTrackObject);
  },
  
  addTrack : function(trackID, playlistID) {
    this.tracks[trackID].containingPlaylists[playlistID] = this.playlists[playlistID];
    this.playlists[playlistID].containedTracks[trackID] = this.tracks[trackID];
  },
  
  removeTrack : function(trackID, playlistID) {
    delete this.playlists[playlistID].containedTracks[trackID];
    delete this.tracks[trackID].containingPlaylists[playlistID];
    if (Object.keys(this.tracks[trackID].containingPlaylists).length == 0)
      delete this.tracks[trackID];
  }
}