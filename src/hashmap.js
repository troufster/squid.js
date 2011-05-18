/**
 * Hashmap.js v0.6-squid
 * 
 * @author Stefan Pataky 
 * 
 * squid-specifics:
 * Entity : [x,y,shapekey, controlindex] for a 2d vector
 */
(function(){
/**
* Module dependencies
*/
var Vector = require('Vector'),
     Base = require('Base');

 /**
 *Zone constructor
 * @param {string} name zone name.
 * @param {int} cellsize the w/h of each cell in the grid.
 * @constructor
 */
function Zone(name, cellsize) {
  this.name = name;
  this.grid = {};  //Grid hash
  this.ent = [];  //Raw entity list
  this.cellSize = cellsize;
};


/**
 * Gets the bucket key for a vector
 * @param {Vector} vec vector.
 * @return {int} key.
 * @deprecated use _fastKey instead.
 */
Zone.prototype._key = function(vec) {
  var cs = this.cellSize,
      a = Math.floor(vec[0] / cs),
      b = Math.floor(vec[1] / cs);

  return (b << 16) ^ a;
};


/**
 * Gets the bucket key for a x, y pair
 * and returns the hash string
 *
 * @param {float} x x-coordinate.
 * @param {float} y y-coordinate.
 * @return {int} key.
 */
Zone.prototype._rawKey = function(x, y) {
  var cs = this.cellSize,
      a = Math.floor(x / cs),
      b = Math.floor(y / cs);

  return (b << 16) ^ a;
};


/**
 * Gets the bucket key for a x,y pair without cs lookup
 * @param {float} x xcoord.
 * @param {float} y ycoord.
 * @param {int} c cellSize of grid.
 * @return {int} key.
 */
Zone._fastKey = function(x, y, c) {
  var a = Math.floor(x / c),
      b = Math.floor(y / c);

  return (b << 16) ^ a;
};

/**
 * Resets the entity list
 */
Zone.prototype.reset = function() {
  this.ent = [];
}

/**
 * Add a shape to the internal entity list
 * 
 * Adds all .data .origin and .anchors
 */
Zone.prototype.addShape = function(shape) {
  var d = shape.data,
      dl = d.length,
      e = this.ent,
      o = shape.origin;
  if(!o) return;

  this.ent.push([o[0], o[1], shape.index, null]);
  
  while(dl--) {
    var td = d[dl];
    if(!td.length > 1) continue;
    this.ent.push([td[0] + o[0], td[1] + o[1], shape.index, dl]);
  }
    
  var a = shape.type.anchors,
      al = (a ? a.length : 0);
  
  while(al--) {
    var an = a[al];
    this.ent.push([an[0] + o[0], an[1] + o[1], shape.index, 'anchor']);
  }
}

/**
 * Adds an entity to the zone entity list
 *
 * @param {Entity} e Entity.
 * @param {function} _cb callback(err, entity.id).
 */
Zone.prototype.addEntity = function(e, _cb) {
  this.ent[e[2]] = e;
  _cb(null, e[2]);
};


/**
 * Returns an entity from the entity list based on its id
 *
 * @param {var} id Entity id.
 * @return {Entity} Matching entity.
 */
Zone.prototype.getEntity = function(id) {
  return this.ent[id];
};


/**
 * Deletes an entity from the entity list based on its id
 *
 * @param {var} id Entity id.
 */
Zone.prototype.delEntity = function(id) {
  delete this.ent[id];
  //  this.ent.splice(id,1);
};


/**
 * Returns entities in the same hash bucket as the given vector
 *
 * @param {Vector} vec Vector.
 * @param {function} _cb callback(error,result);.
 */
Zone.prototype.getClosest = function(vec) {
  var key = this._rawKey(vec[0], vec[1]);
  return this.grid[key];
};


/**
 * Get the keys of the buckets within range n from a given vector
 *
 * @param {Vector} vec Vector.
 * @param {float} n checking range.
 * @param {function} _cb callback(error,result).
 */
Zone.prototype.getAreaKeys = function(vec, n, _cb) {
  if (!vec || !n) _cb('No vector or distance supplied');

  var nwx = vec[0] - n,
      nwy = vec[1] - n,
      sex = vec[0] + n,
      sey = vec[1] + n,
      cs = this.cellSize,
      grid = this.grid,
      retval = [],
      rk = Zone._fastKey;

  //Eyes open for float errors here..
  for (var x = nwx; x <= sex; x = x + cs) {
    for (var y = nwy; y <= sey; y = y + cs) {
      var g = rk(x, y, cs);
      retval.push(g);
    }
  }

  _cb(null, retval);
};


/**
 * Gets the Id of all entities within distance n of the given vector
 *
 * @param {Vector} vec Vector.
 * @param {float} n checking range.
 * @param {function} _cb callback(err,[ids]);.
 */
Zone.prototype.getAreaIds = function(vec, n, _cb) {
  if (!vec || !n) _cb('No vector or distance supplied');
  
  //Todo: this needs to start at NW corner of zone vector is in...
  //Get all entities within a certain area around the supplied vector
  var anwx = vec[0] - n,
      anwy = vec[1] - n,
      asex = vec[0] + n,
      asey = vec[1] + n,
      cs = this.cellSize,
      retval = [],
      grid = this.grid,
      rk = Zone._fastKey;
        

  //Step with this.cellSize in x/y, dump id of entities along the way
  //Subtract/add 1 to start/end positions to prevent float rounding issues
  //bug with entities falling out of AOI was caused by this
  for (var x = anwx - 1; x <= asex + 1; x = x + cs) {
    for (var y = anwy - 1; y <= asey + 1; y = y + cs) {     
      var g = grid[rk(x, y, cs)];      
      if(!g) continue;
      var gl = g.length;
      
      while(gl--){
        var thiseid = g[gl][2];
        if(retval.indexOf(thiseid) == -1) retval.push(thiseid);
      }                  
      
    }
  }

  _cb(null, retval);

};


/**
 * Rebuilds the grid hash
 *
 */
Zone.prototype.update = function() {
 
  delete this.grid;
  this.grid = {};
 
  var ent = this.ent,
      g = this.grid,
      cs = this.cellSize,
      atg = Zone.addToGrid,
      el = ent.length;
  
 // for (var e in ent) {
  while(el--) {
    atg(ent[el], g, cs);
  }

};


/**
 * Adds a raw entity to the grid hash
 *
 * @param {Entity} e Entity.
 * @param {Array} grid zone instance grid.
 * @param {int} cs grid cell size.
 */
Zone.addToGrid = function(e, grid, cs) {
  if (!e || !grid || !cs) return;

  //Data needed, entity position, checking distance
  var px = e[0],
      py = e[1],
      dist = 5, //squid, 5 = good for anchor picking on a 50 grid it seems. Tune this later
      distdist = dist + dist;

  //Add double the objects radius to the position to form padded AABB
  //we pad because the grid is not updated every tick, and the padding
  //prevents an entity from suddenly swithing cells between updates
  co = [px - distdist, py - distdist,
        px + distdist, py - distdist,
        px - distdist, py + distdist,
        px + distdist, py + distdist],

  //cells entity needs to be in
  ec = [],

  //local ref to key function
  rk = Zone._fastKey;

  //For each corner of AABB check corners location
  //and add entity to all cells that the AABB corners are in
  //This does not allow for objects larger than cells, but then
  //again this is not needed in this implementation.
  //To allow for such objects simply iterate nw->se corner and step
  //with distdist or something smaller than cellsize and add entity
  //to each iterated location.
  for (var c = 0; c < 8; c = c + 2) {
    var key = rk(co[c], co[c + 1], cs);
    if (ec.indexOf(key) == -1) {
      ec.push(key);
      var gk = grid[key];
     
      gk ? gk.push(e) : grid[key] = [e];
    }
  }
};

Base.plugin(Zone);


})();
