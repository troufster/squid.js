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
  };
  
  Base.plugin(Shape);
})();
