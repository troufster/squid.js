 (function(S){
	 
	 var Squid = new S({ canvas : 'canvas'});
	 
	 Squid.shape(function() {
	   
		 this.name('Star');		 
		 this.states(['NoFill', 'HalfFill', 'Fill']);
		 this.color('#f00', '#f00');		 
     this.anchors([[0,20],[20,0],[0,-20],[-20,0]]);		 
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
		this.done();
 
	 });
	 
   Squid.shape(function(){
     this.name('FreehandLine');
     this.states(['Solid', 'Dashed']);
     this.color('#0f0', '#0f0');
     this.prop('dash', false);

     this.draw(function(shape) {
       
       var shapedata = this.shapedata,
           shapes = this.shapes,
           s = shape.data,
           sl = s.length,
           osl = sl,
           ctx= this.ctx,
           dash = shape.dash;

       ctx.save();
       ctx.translate(shape.origin[0], shape.origin[1]);
       ctx.beginPath();

       //Start at the last coord
       sl--;
       ctx.moveTo(s[sl][0], s[sl][1]);

      //for each coord in data
      while(sl--) {
        var a = [s[sl][0], s[sl][1]];
        
        //if dash, move to this point
        if(dash && sl % 2 == 0) {
          ctx.moveTo(a[0], a[1]);
          continue;
        }

        //Otherwise draw line to this point
        ctx.lineTo(a[0],a[1]);

      }

      ctx.stroke();
      ctx.restore();   
      

     });
    this.done(); 

   }); 

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
   
   $('#Free').click(function(evt){
     Squid.setTool(Squid.tools.Freehand, 'FreehandLine' ,true);  
  });
   
	 
 })(Squid);
