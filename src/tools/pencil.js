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
