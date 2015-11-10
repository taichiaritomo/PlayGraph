///* EditStack object stores pending edits. */
//function EditStack() {
//  var adds = {}; // this.adds[playlistID] = [trackIDs]
//  var removes = {}; // this.removes[playlistID] = [trackIDs]
//  
//  this.addTrack = function(trackID, playlistID) {
//    // create new set if set doesn't exist.
//    if (!adds[playlistID])
//      adds[playlistID] = d3.sets([]);
//    // if this song was going to be removed, cancel removal
//    if (removes[playlistID] && removes[playlistID].has(trackID))
//      removes[playlistID].remove(trackID);
//    // add to addsStack
//    adds[playlistID].add(trackID);
//  }
//  
//  this.removeTrack = function(trackID, playlistID) {
//    // create new set if set doesn't exist.
//    if (!removes[playlistID])
//      removes[playlistID] = d3.sets([]);
//    // if this song was going to be added, cancel add
//    if (removes[playlistID] && removes[playlistID].has(trackID))
//      removes[playlistID].remove(trackID);
//  }
//}
//
//
///*
//
//EditStack stucture!
//
//compile disjoint edits of adds and removals
//
//
//
//
//*/