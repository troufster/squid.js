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
      if(this.shapedata.type.onCreate){
        this.shapedata.type.onCreate.call(this, shape);
      }
      this.render();
    }
  };
  
  Base.plugin(SingleTool);
})();
 
