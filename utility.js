/* Set Building utilities */

// returns the intersection of an array of d3 sets.
function intersect(sets) {
  var indexSmallestSet = sets.reduce( function(iMin, c, i, a) {
    return c.size() < a[iMin].size() ? i : iMin;
  }, 0);
  var s = sets[indexSmallestSet],
      result = d3.set(sets[indexSmallestSet].values());
  for (var i = 0; i < sets.length; i++) {
    if (i == indexSmallestSet) continue;
    result.forEach(function(item) { if (!sets[i].has(item)) result.remove(item); });
  }
  return result;
}

// returns the intersection of an array of d3 sets.
function union(sets) {
  var result = d3.set([]);
  for (var i = 0; i < sets.length; i++) {
    sets[i].forEach(function(item) { result.add(item) });
  }
  return result;
}

// returns the set with a set of items excluded.
function difference(a, b) {
  var result = d3.set([]);
  a.forEach(function(item) {
    if (!b.has(item)) result.add(item);
  });
  return result;
}