(function(){
  var Base = require('Base'),
      Common = require('CommonTools'),
      Pencil = require('Pencil'),
      Shape = require('Shape'),
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
           //The current shape should be merged with the shape
           //to attach to at the closest anchor
           //With no start shape..
           origin = Vector.toVector(tool.attachto);
           var parent = shapes[tool.attachto[2]];
           
     
           //Get a vector from anchor to parent origin to compensate..
           var comp = Vector.sub(origin, parent.origin);
           shape.data[0] = shape.origin = origin;
           
           for(var i = shape.data.length-1; i >= 0; i--){
              var x = shape.data[i][0]-origin[0];
              var y = shape.data[i][1]-origin[1];
              shape.data[i] = Vector.add(comp,[x,y]);
           }
              
           //Transfer data
           parent.data = shape.data;
           parent.type = shapedata.type;
           parent.end = shapedata.end;
           
           //Delete this shape
           delete shapes[shapedata.count];
           
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
