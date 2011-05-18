(function(){
  
  var _G,
  
  _base = {
      noop : function() {},
      
      /**
       * simple OOP-line inheritance
       * https://developer.mozilla.org/en/JavaScript/Guide/Inheritance_Revisited#Alternative_extend()s
       */
      extend : function(child, parent) {            
        child.prototype.__proto__ = parent.prototype;
        child.prototype.__super = parent;                
      },   
      
      /**
       * Add a plugin to the framework
       * 
       * Plugins must be either named functions or provide an id
       */
      plugin : function(context, id) {  
        if(!context.name && !id) throw 'Plugin must be named scope or have an id'
        
        var m = id || context.name;
        _G[m] = context;
        
        //log('[Framework]','loaded module:', m);
      },
      
      log : log,
      
      keys : {
        //Num keys
        N1 : 49,
        N2 : 50,
        N3 : 51,
        N4 : 52,
        N5 : 53,
        N6 : 54,
        N7 : 55,
        N8 : 56,
        //Letter keys
        T : 84
      }
  };
  
  //window._G exposes the internal scope
  //only keep for debugging and tests
  _G = window._G = { Base : _base };
 
  //Make require public
  window.require = require;
  
  //Module sink for shared modules
  window.module = { exports : {} };
 
  /**
   * Safe logging 
   */
  function log(){
    if (typeof window.console !== 'undefined') {
      console.log([].slice.call(arguments).join('\t'));
    }
  }
  
  /**
   * Browser version of require to allow sharing
   * of CommonJS server modules
   * 
   * This will strip the filename of a path and 
   * uppercase the first character
   * 
   * e.g. ../public/lib/vector becomes Vector.
   * 
   * @param {String} path path of required file.
   * @returns {Object} Whatever module matches the require.
   */
  function require(path) {
    var p = path.lastIndexOf('/'),
    f = path.substr(p+1,1),
    r = path.substr(p+2),
    t = f.toUpperCase() + r;
    
    if(!_G[t]) throw 'No such module' + t;
    
    return _G[t];
  };
  
  
})();
(function(){
  var Base = require('Base');
  
  /**
   * Returns a new vector
   */
  function Vector(x,y){ 
    return [x,y];
  }

  /**
   * Subtracts one vector from another
   */
	Vector.sub = function(vec1,vec2){
		return [vec1[0]-vec2[0], vec1[1]-vec2[1]];
	}
  
	/**
	 * Tests if the supplied argument is a vector :P
	 */
	Vector.isVector = function(o) {
	  return o.length > 1;
	}
	
	/**
	 * Cuts excess of a longer array
	 */
  Vector.toVector = function(ary){
   return ary.slice(0,2);
  }
  
  /**
   * Adds two vectors together
   */
  Vector.add = function(vec1, vec2) {
    return [vec1[0] + vec2[0], vec1[1] + vec2[1]];
  }
  
  /**
   * Returns the distance between two vectors
   */
  Vector.distSqrt = function(vec1,vec2){
    var dist = [vec1[0]-vec2[0],vec1[1]-vec2[1]];
    return Math.sqrt(dist[0] * dist[0] + dist[1] * dist[1]);   
  }
  
  /**
   * Returns a vectors heading
   */
  Vector.heading = function(vec) {
    return (-Math.atan2(-vec[1], vec[0]));
  }
  
  //Attach to framework
  Base.plugin(Vector);
  
})();
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
(function(){
  var Base = require('Base');
  /*
   * A shape in the scene
   */
  function Shape(data){
    this.type = data.type;
    this.index = data.count;
    this.data = [];     
    this.origin = null;     
    this.fillStyle = data.type.fillStyle;
    this.strokeStyle = data.type.strokeStyle;
    this.label = "";
    this.state = data.state;           
    this.children = [];     
    this.parent = null;
  };
  
  Base.plugin(Shape);
})();
(function(){
  var Base = require('Base'),
      Vector = require('Vector');
  
  /**
   * Show anchors under mouse
   */
  function anchorsUnderMouse(ev) {
      var tool = this.tool,
          context = this.ctx,
          nearest = nearestAnchor.call(this, ev);
      
      if(nearest && !tool.started) {
        if(nearest[0] < 30) {
          //Draw
          var n = nearest[1];
          context.beginPath();
          context.arc(n[0],n[1],3,0,Math.PI*2,true);
          context.closePath();
          context.stroke();
          
        }
       
      }
  };
  
  /**
   * Get nearest anchors for a vector
   */
  function nearestAnchorVec(vec) {
    return nearestAnchor({_x : vec[0], _y : vec[1]});
  };
  
  /**
   * Get nearest anchors for an event
   */
  function nearestAnchor(ev) {  
    var evvec = [ev._x, ev._y],
        tool = this.tool;

    if(!tool.started) this.render();
      var closest = this.grid.getClosest(evvec),
      cl = closest ? closest.length : 0,
      dists = [];
      
      while(cl--) {
        if(closest[cl][3] != 'anchor') continue;
        var dist = Vector.distSqrt(closest[cl], evvec);
        dists.push([dist, closest[cl]]);
      }
     
     var nearest = dists.sort(function(a,b){ return a[0] -b[0];})[0];
     
     return nearest;
  };
  
  
  /**
   * Sample an event
   */
  function sample(ev){
    var s = this.shapes,
        c = this.shapedata.count;
    
    if(s[c]) s[c].data.push([ev._x,ev._y]);
  }
  
  var Common = {
      anchorsUnderMouse : anchorsUnderMouse,
      nearestAnchorVec : nearestAnchorVec,
      nearestAnchor : nearestAnchor,
      sample : sample
  }
  
  Base.plugin(Common, 'CommonTools');
})();
(function(){
  var Base = require('Base');

  function Pencil(){
    this.started = false;
  };

  Pencil.prototype = {
    mousedown: function(ev){
      var ctx = this.ctx;
      
      ctx.shadowBlur = 1;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ev._x, ev._y);
      this.tool.pencil.started = true;
    },
    mousemove: function(ev){
      var pencil = this.tool.pencil;
      if(pencil.started) {
        var ctx = this.ctx;
        ctx.lineTo(ev._x, ev._y);
        ctx.stroke();
      }
    },

    mouseup: function(ev){
      var pencil = this.tool.pencil;
      if(pencil.started) {
        pencil.mousemove.call(this, ev);
        pencil.started = false;
      }
    }

  };

  Base.plugin(Pencil);
})();
(function(){
  var Base = require('Base'),
      Shape = require('Shape');
  /*
   * Tool used for creating standalone shapes
   */
  function SingleTool() {};
  
  SingleTool.prototype = {
    mouseup : function() {},
    mousemove : function() {},
    mousedown : function(ev) {            
      var shape = new Shape(this.shapedata);
            
      shape.origin = [ev._x, ev._y];            
      this.shapes[this.shapedata.count] = shape;
      this.shapedata.count++;
                       
      this.render();
    }
  };
  
  Base.plugin(SingleTool);
})();
 (function(){
  var Base = require('Base'),
      Common = require('CommonTools'),
      Pencil = require('Pencil'),
      Shape = require('Shape'),
      Vector = require('Vector'),
      anchorsUnderMouse = Common.anchorsUnderMouse,
      nearestAnchor = Common.nearestAnchor;
  
  
  
  /**
   * Freehand line sampler
   */
  function Sampler() {
    this.started = false;
    this.samplenext = true; 
    this.sample = Common.sample;
    this.pencil = new Pencil();
  }
  
  Sampler.prototype = {
      mousemove : function(ev, tool){
        var tool = this.tool;        
        
        //Show anchors under mouse
        anchorsUnderMouse.call(this,ev);
        
       
        
        
        tool.pencil.mousemove.call(this,ev);
        if(!tool.samplenext || !tool.started)return;
      
        tool.sample.call(this,ev);
        tool.samplenext = false;
        setTimeout(function(){ tool.samplenext = true;}, 30);
      },
      
      mousedown : function(ev){
        tool = this.tool;
        tool.started = true;
        tool.pencil.mousedown.call(this,ev);
        var shapedata = this.shapedata,
            shapes = this.shapes;
            
        shapes[shapedata.count] = new Shape(shapedata);
        var nearest = nearestAnchor.call(this,ev);
       
        if(nearest && nearest[0] < 30) {
          tool.attachto = nearest[1];
        } else {
          tool.attachto = null;
        }
        
        
        
      },
      mouseup : function(ev, tool){
        var tool = this.tool;
        tool.pencil.mouseup.call(this,ev);
        var shapes = this.shapes,
            shapedata = this.shapedata;
        
        tool.sample.call(this,ev);
        if (tool.started) {
          tool.started = false;
          var shape = shapes[shapedata.count];
          if(shape.data.length < 5) {
            delete shapes[shapedata.count];
            this.render();
            return;
          }
                
          var origin;
          
          
         if(tool.attachto){
          //The current shapes origin should be the closest anchor, and be added as a child
           //of the parent shape.
          origin = Vector.toVector(tool.attachto);
          var parent = shape.parent =  shapes[tool.attachto[2]];
          
          //Get a vector from anchor to parent origin to compensate child position
          //var comp = Vector.sub(origin, parent.origin);
          shape.data[0] = shape.origin = origin;//Vector.sub(origin, comp);
          
          //Add as child
          for(var i = shape.data.length-1; i>=0; i--) {
            var x = shape.data[i][0]-origin[0];
            var y = shape.data[i][1]-origin[1];
            shape.data[i] = [x,y];
          }
          parent.children.push(shape);
          shapedata.count++;
         }
          else{
            shape.end = shapedata.end;
            shape.start = shapedata.start;
            origin = shape.data[0];
            
           //Todo: Actually select anchor that is closest to the drawn line components.. 
            var anchors = shape.anchors,
                //al = anchors ? anchors.length :0,
                hits = [];
            
            for(var i = shape.data.length-1; i >= 0; i--){
              var vec = shape.data[i];
               al = anchors ? anchors.length :0;
              while(al--) {
                  var dist = Vector.distSqrt(vec, Vector.add(origin, anchors[al]));
                  hits.push([dist, al]);
              }
            }
            
            var nearest = (hits.count > 0 ? hits.sort(function(a,b){ return a[0]-b[0];})[0][1] : null);
                                   
            
            shape.origin = origin = (anchors ? Vector.add(origin, anchors[0]) : origin);
            for(var i = shape.data.length-1; i >= 0; i--){
               var x = shape.data[i][0]-origin[0];
               var y = shape.data[i][1]-origin[1];
               shape.data[i] = [x,y];
            }
            shapedata.count++;
            
            
          }
          this.render();
        }
      }
  };
  
  Base.plugin(Sampler, 'Freehand');
})();
/**
 * Prototypes library
 */
(function(){

  
  //http://ejohn.org/blog/javascript-array-remove/
  Array.prototype.remove = function(from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
  };
  
  //http://vetruvet.blogspot.com/2010/10/drawing-dashed-lines-on-html5-canvas.html
  CanvasRenderingContext2D.prototype.dashedLine = function(x1, y1, x2, y2, dashLen) {
    if (dashLen == undefined) dashLen = 2;
    
    this.beginPath();
    this.moveTo(x1, y1);
    
    var dX = x2 - x1;
    var dY = y2 - y1;
    var dashes = Math.floor(Math.sqrt(dX * dX + dY * dY) / dashLen);
    var dashX = dX / dashes;
    var dashY = dY / dashes;
    
    var q = 0;
    while (q++ < dashes) {
     x1 += dashX;
     y1 += dashY;
     this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x1, y1);
    }
    this[q % 2 == 0 ? 'moveTo' : 'lineTo'](x2, y2);
    
    this.stroke();
    this.closePath();
  };
  
  //http://stackoverflow.com/questions/2172798/how-to-draw-an-oval-in-html5-canvas
  CanvasRenderingContext2D.prototype.drawEllipse = function(x, y, w, h) {
    var kappa = .5522848;
        ox = (w / 2) * kappa, // control point offset horizontal
        oy = (h / 2) * kappa, // control point offset vertical
        xe = x + w,           // x-end
        ye = y + h,           // y-end
        xm = x + w / 2,       // x-middle
        ym = y + h / 2;       // y-middle

    this.beginPath();
    this.moveTo(x, ym);
    this.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    this.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    this.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    this.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
    this.closePath();
    this.stroke();
  }

})();(function() {

  //Base library
  var Base = require('Base'),
  
  //Hashmap implementation
  Zone = require('Zone'),
  
  //Vector implementation,
  Vector = require('Vector'),
  
  //Single shape tool
  SingleTool = require('SingleTool'),
  
  //Freehand shape tool
  Freehand = require('Freehand'),
  
  //Shape implementation
  Shape = require('Shape'),
  
  //Hold all declared shapes
  _shapetype = {},
  
  //Internal functions
  fn = {
    /*
     * Normalizes events across browsers
     * @param MouseEvent ev The event to normalize 
     */
    eventProcessor : function(ev) {
      //Firefox
      if (ev.layerX || ev.layerX === 0) { 
          ev._x = ev.layerX;
          ev._y = ev.layerY;
      //Opera
      } else if (ev.offsetX || ev.offsetX === 0) { 
          ev._x = ev.offsetX;
          ev._y = ev.offsetY;
      }
      return ev;
    },
    
    /*
     * Stops an event from bubbling on
     */
    stopEvent : function(evt){
      if (evt.stopPropagation) {
        evt.stopPropagation();
      } else {
        evt.cancelBubble = true;
      }
    },       
    
    /*
     * Try to locate a canvas and get it's 2d context
     */
    initCtx : function(selector) {
      // Find the canvas element.
      var _canvas = document.getElementById(selector);
      if (!_canvas) {
        throw 'Error: I cannot find the canvas element!';
      }
      
      //Fix for selecting text on canvas clicks
      _canvas.onselectstart = function () { return false; };
   
      if (!_canvas.getContext) {
        throw 'Error: no canvas.getContext!';
      }

      // Get the 2D canvas context.
      var _ctx = canvas.getContext('2d');
      if (!_ctx) {
        throw 'Error: failed to getContext!';
      }
      
      return [_canvas, _ctx];
    }
       
  };
      
 
  
  /*
   * Main 
   */
  function Squid(options) {
    var self = this,
        c = fn.initCtx(options.canvas);
    
    this.grid = new Zone('Grid',options.gridsize || 50);
    this.ctx = c[1];
    this.canvas = c[0];
    this.receiver = null;
    this.tool = null;
    this.tools = { 
                    SingleTool : new SingleTool(),
                    Freehand : new Freehand()
    
                  };
    this.shapes = {};
    this.drawmode = false;
    this.mousedown = false;
    
    /*
     * Normalize all events and bind to this scope 
     */
    function eventWrapper(ev) {
      ev = fn.eventProcessor(ev);
      self.canvasEvents.call(self,ev);
    }
    
    //Attach events
    this.canvas.addEventListener('mousemove', eventWrapper, false);
    this.canvas.addEventListener('mousedown', eventWrapper, false);
    window.addEventListener('mouseup', eventWrapper,false);    
  }
  
  /*
   * Sets this squid out of drawmode
   */
  Squid.prototype.select = function() {
	  this.drawmode = false;
  };
  
  /*
   * Set the current tool to use
   */
  Squid.prototype.setTool = function(tool, shape, drawmode) {
	  this.tool = tool;	  
	  this.shapedata.type = _shapetype[shape];
	  
	  if(drawmode) { 
      this.drawmode = true;
    }
  };
 

  Squid.prototype.toggleControls = function() {
    this.shapedata.showcontrols = !this.shapedata.showcontrols;
    this.render();
  };

  Squid.prototype.drawControls = function(shape) {
    var sel = this.shapedata.selectedcontrol ? this.shapedata.selectedcontrol[1] : null;
    var data = shape.data;
    var dl = data.length;
    var ctx = this.ctx;

    while(dl--) {
        ctx.strokeStyle = ctx.shadowColor = '#aaa';      //Highlight selected control point in selected shape
      if(dl == sel && this.shapedata.selectedcontrol[0] == shape.index){ 
        ctx.shadowColor = ctx.strokeStyle = '#5fb';
      }  
      var a = Vector.add(data[dl],shape.origin);
      ctx.beginPath();
      ctx.arc(a[0],a[1],3,0,Math.PI*2,true);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.strokeStyle = ctx.shadowColor = (shape.parent ? shape.parent.strokeStyle : shape.strokeStyle);
;
  }; 
  /*
   * Render the current scene
   */
  Squid.prototype.render = function() {
    //reset canvas
	  this.canvas.width = this.canvas.width;
	  
	  var shapes = this.shapes,
	      ctx = this.ctx,
	      selected = this.shapedata.selected,
        self = this;
	    
	  //Reset the grid  
	  this.grid.reset();
	  ctx.lineWidth = 2;
	  ctx.shadowBlur= 1;
	  
	  for(var shape in shapes){
	    var thisshape = shapes[shape];
	    
      if(!thisshape.parent) {
        //color accordingly, or shade if selected
        ctx.fillStyle = thisshape.fillStyle;
        ctx.strokeStyle = ctx.shadowColor = thisshape.strokeStyle;
            
        ctx.shadowBlur = (selected && thisshape.index == selected.index ? 9 : 1);     
    
        //Call the shapes internal draw method in context of this squid
        thisshape.type.draw.call(this, thisshape);	      
        var controls = false;

       //Draw control
        var hasSelection = (selected && (thisshape.index == selected.index)); 
        if(this.shapedata.showcontrols && hasSelection) { 
          this.drawControls(thisshape);
          controls = true;
        } 
        //Draw and grid children
        var cl = thisshape.children.length;
        while(cl--){
          var child = thisshape.children[cl];
          child.type.draw.call(this, child);
          if(controls) {
            this.drawControls(child);
          }
        }    
      }
      
      //Add shape to grid
	    this.grid.addShape(thisshape);
	    

	  }	    
	    
	  //Recreate the grid hash
	  this.grid.update();	   
  };
  
  /*
   * Data used for new shapes
   */
  Squid.prototype.shapedata = {
    state : null,
    count : 0,
    type : null,
    selected : null,
    selectedcontrol : null,
    showcontrols : false
  };
  
  /*
   * Main mouse event handler 
   */
  Squid.prototype.canvasEvents = function(ev) {
   
    //Pick if not drawing
    if(!this.drawmode ) return this.pick(ev); 
    
    //Call tool with ev.type and instance of tool
	  if(this.tool) this.tool[ev.type].call(this, ev);
	  
  };
  
  Squid.prototype.hasSelection = function() {
    return !!this.shapedata.selected;
  };
  
  Squid.prototype.selectedShape = function() {
    return this.shapedata.selected;
  };
  
  /**
   * Sets both selected shape and tool color
   * 
   * @param {RGBcolor} stroke strokeStyle color
   * @param {RGBcolor} fill fillStyle color
   */
  Squid.prototype.setColor = function(stroke, fill) {
    if(stroke) { 
      this.shapedata.strokeStyle = stroke;
      if(this.hasSelection()) this.selectedShape().strokeStyle = stroke;
    }
    if(fill) {
      this.shapedata.fillStyle = fill;
      if(this.hasSelection()) this.selectedShape().fillStyle = fill;
    }  
    //Redraw canvas
    this.render();
  };
  
  /*
   * Registers a new shape 
   */
  Squid.prototype.shape = function(s) {
    s.call(this);
  };
  
  Squid.prototype.prop = function(key, value) {
    this.hasReceiver();
    this.receiver[key] = value;
  }
  /*
   * Sets the name of the shape being configured
   */
  Squid.prototype.name = function(name) {
	  _shapetype[name] = { name : name } ;
	  this.receiver = _shapetype[name];	  
  };
  
  /*
   * Finishes configuration
   */
  Squid.prototype.done = function() {
    this.receiver = null;
  };
  
  /*
   * Checks if there is a shape being configured
   */
  Squid.prototype.hasReceiver = function() {
	  if(!this.receiver) throw new Error("No shape active for configuration");
	  return !!this.receiver;
  }
  
  /*
   * Set a shape's states
   */
  Squid.prototype.states = function(states) {
	  if(this.receiver.state) throw new Error("States already set for this shape");
	  
	  this.receiver.states = {};	  
	  var sl = states.length;
	  while (sl--) {
		  this.receiver.states[states[sl]] = sl;
	  }
	  
  };
  
  /* 
   * Set a shape's stroke/fill colours
   */
  Squid.prototype.color = function(stroke, fill) {
	  this.hasReceiver();
	  if(stroke) {
		  this.receiver.strokeStyle = stroke;		  
	  }
	  if(fill) {
		  this.receiver.fillStyle = fill;
	  }
  };
  
  /*
   * Set a shape's anchors (for attaching child shapes)
   */
  Squid.prototype.anchors = function(a) {
    this.hasReceiver();
    this.receiver.anchors = a;
  };
  
  /*
   * Sets a shape's draw method
   */
  Squid.prototype.draw = function(draw) {
	  this.hasReceiver();
	  this.receiver.draw = draw;
  }
  
  /**
   * Handles picking of drawn shapes/controls
   */
  Squid.prototype.pick = function(ev){
    
    //Reset mouse cursor
    document.body.style.cursor = 'default';
    
    var shapes = this.shapes,
        shapedata = this.shapedata,
        mousedown = this.mousedown;
    
    
    //Control point highlighting of selected shape
    //Mouse moving but not down
    if(ev.type == 'mousemove' && !mousedown) {    
      
     //Show hand if nearby shapes
     this.hover(ev);
     
     //Return if no shape is selected
     if(!shapedata.selected) return;
     
     var data = shapedata.selected.data,
         origin = shapedata.selected.origin,
         dl = data.length,
         selindex;
      
     var shapesToCheck = [];
     shapesToCheck.push(shapedata.selected);
     shapesToCheck = shapesToCheck.concat(shapedata.selected.children);

     var len = shapesToCheck.length;
     var evvec = [ev._x, ev._y];
     while(len--) {
       var thisshape  = shapesToCheck[len];
       var data = thisshape.data;
       var origin = thisshape.origin;
       var dl = data.length;
       while(dl--) {
        var point = data[dl];
        var opoint = Vector.add(point, origin);
        var sqrt = Vector.distSqrt(evvec, opoint);

        if (sqrt < 10) {
          shapedata.selectedcontrol = [thisshape.index, dl, thisshape.parent.index]
          this.render();
          return;
        }
       }       
     }
    }
    
    
    //Mouse is down, pick a shape for selection
    if(ev.type == 'mousedown'){
      this.mousedown = true;
     
      var closest = this.grid.getClosest([ev._x, ev._y]);
      var picked = false;
      
      var cl = closest ? closest.length : 0;   
     
      while(cl--) {
        var point = closest[cl];
        var xdist = ev._x - point[0];
        var ydist = ev._y - point[1];
        var sqrt = Math.sqrt(xdist*xdist+ydist*ydist);
        
        if(sqrt < 35) {
          
          //Clicked near enough a shape origin. Set it to selected
          //if(shapes[point[2]].parent) return; //Dont pick children
          shapedata.selected = shapes[point[2]];      
          
          //If picked child, set parent as selected
          if(shapedata.selected.parent) {
            shapedata.selected = shapedata.selected.parent;
          }          
                 
          //Set label into gui box
          //$('#txtlabel').val(shapedata.selected.label);
          
          this.render();
          picked = true;
          break;
        }
      } 
      
      if(picked)return;
      
      
      //If we reach this, nothing was picked so deselect
      shapedata.selected = shapedata.selectedcontrol = null;
      this.render();
    }
    
   
    else if(ev.type == 'mousemove' && !shapedata.showcontrols && mousedown && shapedata.selected) {
      //Move shape
      var clicked = [ev._x, ev._y],
          mover = shapedata.selected;
      if(mover.parent) return;      
      if(Vector.distSqrt(clicked,mover.origin) > 50) return;
       
        var cl = mover.children.length;
        //Move children if any
        while(cl--){
          var child = mover.children[cl];
          var comp = Vector.sub(mover.origin, child.origin);
         child.origin = Vector.sub(clicked, comp);
        }
        
       mover.origin = clicked;
      this.render();
    
    }
    
    else if(ev.type == 'mousemove' & shapedata.showcontrols && mousedown && shapedata.selected && shapedata.selectedcontrol != null) {
       //Move that control & render!
     // var shape = shapedata.selected;
     var shape = this.shapes[shapedata.selectedcontrol[0]];

      if (shapedata.selectedcontrol[1] > 0 ){
        shape.data[shapedata.selectedcontrol[1]] = [ev._x - shape.origin[0], ev._y - shape.origin[1]];
        this.render();
      } 
    }
    
    else  {
      this.mousedown = false;
     
    }
    
    if(shapedata.selectedcontrol && ev.type == 'mouseup') {
      //shapedata.selectedcontrol = null;
      this.render();
    }    
  };
  
  /* 
   * Show a pointer cursor if there are objects nearby in the grid
   */
  Squid.prototype.hover = function(ev){
    var closest = this.grid.getClosest([ev._x, ev._y]);
    
    if(!closest) return;
    
    document.body.style.cursor = 'pointer';
  };
 
  Squid.Vector = Vector; 
  window.Squid = Squid;
  
  
})();
