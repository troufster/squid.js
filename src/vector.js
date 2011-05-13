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
