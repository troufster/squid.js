(function() {

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
  
  //Line shape tool
  Line = require('Line'),

  //Shape implementation
  Shape = require('Shape'),

  //Hold all declared shapes
  _shapetype = {},
  
  //Internal functions
  fn = {
    /**
     * Normalizes events across browsers
     * @param {MouseEvent} ev The event to normalize 
     * @private
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
    
    /**
     * Stops an event from bubbling on
     * @param {MouseEvent} ev Event
     * @private
     */
    stopEvent : function(evt){
      if (evt.stopPropagation) {
        evt.stopPropagation();
      } else {
        evt.cancelBubble = true;
      }
    },       
    
    /**
     * Try to locate a canvas and get it's 2d context
     * @param {String} selector Id string of canvas to attach to
     * @private
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
      var _ctx = _canvas.getContext('2d');
      if (!_ctx) {
        throw 'Error: failed to getContext!';
      }
      
      return [_canvas, _ctx];
    }
       
  };
      
 
  
  /**
   * Creates a new squid
   * 
   * options:
   *  options.canvas : the id of the canvas this squid should work on
   *  options.gridsize : size of the internal spatial hash grid
   *
   * @constructor 
   * @param {object} options Squid options
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
                    Freehand : new Freehand(),
                    Line : new Line()
                     
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
  
  /**  
   * Sets this squid out of drawmode
   * and into select mode
   * @this {Squid}
   */
  Squid.prototype.select = function() {
	  this.drawmode = false;
  };
  
  /**
   * Set the current tool to use
   * @param {Tool} tool Tool instance
   * @param {ShapeType} shape The type of shape to use with the tool
   * @param {bool} drawmode Also set drawmode
   * @this {Squid}
   */
  Squid.prototype.setTool = function(tool, shape, drawmode) {
	  this.tool = tool;	  
	  this.shapedata.type = _shapetype[shape];
	  
	  if(drawmode) { 
      this.drawmode = true;
    }
  };
 
  /**
   * Toggles showing of selected shape's control points
   * @this {Squid}
   */
  Squid.prototype.toggleControls = function() {
    this.shapedata.showcontrols = !this.shapedata.showcontrols;
    this.render();
  };

  /**
   * Draws controls points of a shape
   * @param {Shape} shape shape to draw control points for
   * @private
   * @this {Squid}
   */
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

  /**
   * Render/redraw the current scene
   * @this {Squid}
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
  
  /**
   * Main mouse event handler 
   * @private
   */
  Squid.prototype.canvasEvents = function(ev) {
   
    //Pick if not drawing
    if(!this.drawmode ) return this.pick(ev); 
    
    //Call tool with ev.type and instance of tool
	  if(this.tool) this.tool[ev.type].call(this, ev);
	  
  };
  
  /**
   * Is there something selected?
   */
  Squid.prototype.hasSelection = function() {
    return !!this.shapedata.selected;
  };
  
  /** 
   * The current selected shape
   * @returns {Shape} selected shape
   */
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
  
  /**
   * Registers a new shape during configuration
   * @param {function} s Shape declaration function to be called in context of Squid
   */
  Squid.prototype.shape = function(s) {
    s.call(this);
  };
  
  /**
   * Sets a shape property during configuratin
   */ 
  Squid.prototype.prop = function(key, value) {
    this.hasReceiver();
    this.receiver[key] = value;
  };

  /**
   * Sets the name of the shape being configured
   */
  Squid.prototype.name = function(name) {
	  _shapetype[name] = { name : name } ;
	  this.receiver = _shapetype[name];	  
  };
  
  /**
   * Finishes configuration of a shape
   */
  Squid.prototype.done = function() {
    this.receiver = null;
  };
  
  /**
   * Checks if there is a shape being configured
   */
  Squid.prototype.hasReceiver = function() {
	  if(!this.receiver) throw new Error("No shape active for configuration");
	  return !!this.receiver;
  };
  
  /**
   * Set a shape's states
   * Todo : implement state specific handlers for shape
   */
  Squid.prototype.states = function(states) {
	  if(this.receiver.state) throw new Error("States already set for this shape");
	  
	  this.receiver.states = {};	  
	  var sl = states.length;
	  while (sl--) {
		  this.receiver.states[states[sl]] = sl;
	  }
	  
  };
  
  /** 
   * Set a shape's stroke/fill colours during configuration
   * @param {RGBcolor} stroke Stroke color
   * @param {RGBcolor} fill Fill color
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

  //Todo: document
  Squid.prototype.onCreate = function(callback) {
    this.hasReceiver();
    this.receiver.onCreate = callback;
  };
  /**
   * Set a shape's anchors during configuration (for attaching child shapes)
   * @param {[Vector]} a Array of anchor vectors
   */
  Squid.prototype.anchors = function(a) {
    this.hasReceiver();
    this.receiver.anchors = a;
  };
  
  /**
   * Sets a shape's draw method during configuration
   * @param {function} draw Draw callback called in context of squid with shape as argument
   */
  Squid.prototype.setDraw = function(draw) {
	  this.hasReceiver();
	  this.receiver.draw = draw;
  }
  
  /**
   * Removes current selection (Shape/Control poing)
   * Todo: implement
   */
  Squid.prototype.removeSelected = function() {
  
  };

  /**
   * Handles picking of drawn shapes/controls
   * @private
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
          shapedata.selectedcontrol = thisshape.parent ? [thisshape.index, dl, thisshape.parent.index] : [thisshape.index, dl, 0];
          this.render();
          return;
        }
       }       
     }
    }
    
    
    //Mouse is down, pick a shape for selection
    if(ev.type == 'mousedown'){
      this.mousedown = true;
      var evvec = [ev._x, ev._y]; 
      var closest = this.grid.getClosest(evvec);
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
      shapedata.selected = shapedata.selectedcontrol  =  null;
      this.render();
    }
    
   
    else if(ev.type == 'mousemove' && !shapedata.showcontrols && mousedown && shapedata.selected) {
      //Move shape
      var clicked = [ev._x, ev._y],
          mover = shapedata.selected;

      //Dont allow moving of child shapes
      if(mover.parent) return;      

      //Make sure click was actually near the shape§

      var closest = this.grid.getClosest([ev._x, ev._y]);
      var closefound = false; 
      var cll = closest ? closest.length : 0; 
      while(cll--) {
        var dist = Vector.distSqrt(clicked, closest[cll]);
        if(dist > 50) { continue; }
        closefound = true;
      }

      if(!closefound) return;
       
        var cl = mover.children.length;
        //Move children if any
        while(cl--){
          var child = mover.children[cl];
          var comp = Vector.sub(mover.origin, child.origin);
         child.origin = Vector.sub(clicked, comp);
        }
        
       mover.origin =clicked; 
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
  
  /**
   * Show a pointer cursor if there are objects nearby in the grid
   * @private
   */
  Squid.prototype.hover = function(ev){
    var closest = this.grid.getClosest([ev._x, ev._y]);
    
    if(!closest) return;
    
    document.body.style.cursor = 'pointer';
  };
 
  //Expose 
  Squid.Vector = Vector; 
  window.Squid = Squid;
  
  
})();
