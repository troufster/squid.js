(function () {
  var Base = require('Base'),
      Common = require('CommonTools'),
      Shape = require('Shape'),
      Liner = require('Liner'),
      Vector = require('Vector'),
      anchorsUnderMouse = Common.anchorsUnderMouse,
      nearestAnchor = Common.nearestAnchor;

  function LineSampler() {
    this.attachto = null;
    this.started = false;
    this.justclicked = false;
    this.sample = Common.sample;
    this.liner = new Liner();
  };

  LineSampler.prototype = {
    mousedown : function(ev) {
      var tool = this.tool;
      tool.liner.mousedown.call(this,ev); 
      if(!tool.started) {
        var nearest = nearestAnchor.call(this,ev);
        var shape = new Shape(this.shapedata);
        if(nearest && nearest[0] < 30) {
          tool.attachto = nearest[1];
          shape.origin = Vector.toVector(nearest[1]);
        } else {
          tool.attachto = null;
          shape.origin = [ev._x, ev._y];
        }

        this.shapes[this.shapedata.count] = shape;
        tool.started = true;
      }
      
      
      //Doubleclick
      if(tool.justclicked) {
        tool.liner.end.call(this, ev); 
        var shape = this.shapes[this.shapedata.count];

        //Delete if not enough samples were collected
        if(shape.data.length < 1) {
          delete this.shapes[this.shapedata.count];
          this.render();
          return;
        }

        if(tool.attachto) {
          //Current shape should be merged with parent at closest anchor
          var origin = Vector.toVector(tool.attachto);
          var parent = this.shapes[tool.attachto[2]];
         
          var comp = Vector.sub(origin, parent.origin);

          //Make sure shape starts at anchor
          shape.data[0] = [0,0];

          //Compensate for new anchor
          //for (var i = shape.data.length-1; i >= 0; i--) {
          //  shape.data[i] = Vector.add(comp, shape.data[i]); 
          //};

          //Add parent/child
          parent.children.push(shape);
          shape.parent = parent;


        } else {
          this.shapedata.count++;
        }

        tool.started = false;
        this.render();
        return; 
      } 
        
      var origin = this.shapes[this.shapedata.count].origin;
        
      if(origin) {
        tool.sample.call(this,{_x : ev._x - origin[0], _y : ev._y - origin[1]});
      }
        
      //Start doubleclick timer
      tool.justclicked = true;
      setTimeout(function(){ tool.justclicked = false; }, 250);
     
    },
    mouseup : function(ev) {
    },
    mousemove : function(ev) {
      anchorsUnderMouse.call(this, ev);
      this.tool.liner.mousemove.call(this,ev); 
        
    }
  };

Base.plugin(LineSampler, 'Line');
})();
