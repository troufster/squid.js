(function() {
  
  //Base library
  var Base = require('Base'),
  
  //Hashmap implementation
  Zone = require('Zone'),
  
  //Vector implementation,
  Vector = require('Vector'),
  
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
        throw new Error('Error: I cannot find the canvas element!');
        return;
      }
      
      //Fix for selecting text on canvas clicks
      _canvas.onselectstart = function () { return false; }
   
      if (!_canvas.getContext) {
        throw new Error('Error: no canvas.getContext!');
        return;
      }

      // Get the 2D canvas context.
      var _ctx = canvas.getContext('2d');
      if (!_ctx) {
        throw new Error('Error: failed to getContext!');
        return;
      }
      
      return [_canvas, _ctx];
    }
       
  };
      
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
	};
  
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
    this.tools = { SingleTool : new SingleTool() };
    this.shapes = {};
    this.drawmode = false;
    this.mousedown = false;
    
    /*
     * Normalize all events and bind to this scope 
     */
    function eventWrapper(ev) {
    	ev = fn.eventProcessor(ev);
    	self.canvasEvents.call(self,ev);
    };
    
    //Attach events
    this.canvas.addEventListener('mousemove', eventWrapper, false);
    this.canvas.addEventListener('mousedown', eventWrapper, false);
    window.addEventListener('mouseup', eventWrapper,false);    
  };
  
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
	  
	  if(drawmode) this.drawmode = true;
  };
  
  /*
   * Render the current scene
   */
  Squid.prototype.render = function() {
    //reset canvas
	  this.canvas.width = this.canvas.width;
	  
	  var shapes = this.shapes,
	      ctx = this.ctx,
	      selected = this.shapedata.selected;
	    
	  //Reset the grid  
	  this.grid.reset();
	  ctx.lineWidth = 2;
	  ctx.shadowBlur= 1;
	  
	  for(var shape in shapes){
	    var thisshape = shapes[shape];
	    
	    //color accordingly, or shade if selected
	    ctx.fillStyle = thisshape.fillStyle;
	    ctx.strokeStyle = ctx.shadowColor = thisshape.strokeStyle;
	        
	    ctx.shadowBlur = (selected && thisshape.index == selected.index ? 9 : 1);     
	
	    
	    //Call the shapes internal draw method in context of this squid
	    thisshape.type.draw.call(this, thisshape);	      
	   
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
    selected : null
  };
  
  /*
   * Main mouse event handler 
   */
  Squid.prototype.canvasEvents = function(ev) {
   
    //Pick if not drawing
    if(!this.drawmode ) return this.pick(ev); 
    
    //Call tool with ev.type
	  if(this.tool) this.tool[ev.type].call(this,ev);
	  
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
  
  /*
   * Handles picking of drawn shapes/controls
   */
  Squid.prototype.pick = function(ev){
    
    //Reset mouse cursor
    document.body.style.cursor = 'default';
    
    var shapes = this.shapes,
        shapedata = this.shapedata,
        mousedown = this.mousedown;
    
    
    //Control point highlighting of selected shape
    if(ev.type == 'mousemove' && !mousedown) {    
      
      
     this.hover(ev);
     
     if(!shapedata.selected) return;
     
     var data = shapedata.selected.data;
     var origin = shapedata.selected.origin;
     var dl = data.length;
     var selindex;
     
     while (dl--) {
       var point = data[dl];
       var xdist = ev._x -(point[0] + origin[0]);
       var ydist = ev._y - (point[1] + origin[1]);
       var unsqrt = xdist*xdist + ydist*ydist;
       var sqrt = Math.sqrt(unsqrt);
      
       if (sqrt < 10) {
         shapedata.selectedcontrol = dl;
         this.render();
       }
     }
    }
    
    
 
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
         
          shapedata.selected = shapes[point[2]];      
          
                 
          //Set label into gui box
          $('#txtlabel').val(shapedata.selected.label);
          
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
      var clicked = [ev._x, ev._y];
      
      if(Vector.distSqrt(clicked, shapedata.selected.origin) > 50) return;
       
      shapedata.selected.origin = [ev._x, ev._y];
     
      this.render();
    
    }
    
    else if(ev.type == 'mousemove' & shapedata.showcontrols && mousedown && shapedata.selected && shapedata.selectedcontrol != null) {
       //Move that control & render!
      var shape = shapedata.selected;
     
      if (shapedata.selectedcontrol === 0 ){
        //Move origin (the entire shape moves)
        shape.origin = [ev._x, ev._y];
      } else {
      
      shape.data[shapedata.selectedcontrol] = [ev._x - shape.origin[0], ev._y - shape.origin[1]];
      
      }
      this.render();
      
    }
    
    else  {
      this.mousedown = false;
     
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
  
  window.Squid = Squid;
  
  
})();
