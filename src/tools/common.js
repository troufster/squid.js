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
