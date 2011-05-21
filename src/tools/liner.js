(function(){
  var Base = require('Base');

  function Liner() {
    this.started = false;  
  };

  Liner.prototype = {
    mousedown : function(ev){
      var tool = this.tool.liner;
      tool.started = true;
      tool.mousemove.call(this,ev);
    },
    mouseup : function(ev) {

    },
    mousemove : function(ev) {
      var tool = this.tool.liner;
      var ctx = this.ctx;
      if(tool.started) {
        this.render();
      }
      var shape = this.shapes[this.shapedata.count];

      if(!shape) return;

      var origin = shape.origin;

      if(!origin) return;

      var data = shape.data;
      var lastdata = shape.data[shape.data.length-1];
      ctx.moveTo(lastdata[0] + origin[0], lastdata[1] + origin[1]);
      ctx.lineTo(ev._x, ev._y);
      ctx.stroke();
    },
    end : function() {
      var tool = this.tool.liner;
      tool.started = false;
    }
  };

Base.plugin(Liner);
})();
