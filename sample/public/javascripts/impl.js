 (function(S){
	 
	 var Squid = new S({ canvas : 'canvas'});
	 
	 Squid.shape(function() {
	   
		 this.name('Star');		 
		 this.states(['NoFill', 'HalfFill', 'Fill']);
		 this.color('#f00', '#f00');		 
		 
		 this.draw(function(shape) {	
			 	var context = this.ctx;
			 	
			 	  context.save();
			    context.translate(shape.origin[0], shape.origin[1]);			
			    context.beginPath();
			    context.moveTo(-10,-20);
			    context.lineTo(0,0);
			    context.lineTo(20,5);
			    context.lineTo(5,20);
			    context.lineTo(0,40);
			    context.lineTo(-15,20);
			    context.lineTo(-35,15);
			    context.lineTo(-15, 0);
			    context.lineTo(-10,-20);
			    context.stroke();
			    context.closePath(); 
			    context.restore();
		 });
		 
	 });
	 
	 Squid.done();
	 
	 window.S = Squid;
	 	 	
	 $('#Star').click(function(evt){
	   Squid.setTool(Squid.tools.SingleTool, 'Star' ,true);		
	 });
	 
	 $('#Select').click(function(evt){
	    Squid.select();
	 });
	 
   $('#Blue').click(function(evt){
     Squid.setColor('#00f');
  });
	 
 })(Squid);