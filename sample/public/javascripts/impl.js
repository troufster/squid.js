 (function(S){
	 
	 var Squid = new S({ canvas : 'canvas'});
  var Vector = S.Vector;	

  var drawLib = {
    EndArrow: function(shape) {
    var ctx = this.ctx,
        data = shape.data,
        dl = data.length,
        last = data[dl-1],
        prev = data[dl-2];

      var origin = Vector.add(shape.origin, last);
      var direction = Vector.sub(prev, last);

      ctx.save();
      ctx.translate(origin[0], origin[1]);
      ctx.rotate(Vector.heading(direction) - (Math.PI/2));
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(-10,0);
      ctx.lineTo(0,-10);
      ctx.lineTo(10,0);
      ctx.lineTo(0,0);
      ctx.stroke();
      ctx.restore();
    }
  }

  Squid.shape(function() {
    this.name('Circle');
    this.color('#f0f', '#f0f');
    this.onCreate(function(shape) {
      shape.data = [ [-10,-10],  [10,10]];
    });
    this.setDraw(function(shape) {
      var ctx = this.ctx;
      var dist = Vector.sub(shape.data[1], shape.data[0]);
      var width = dist[0]; 
      var height = dist[1]; 
      ctx.drawEllipse(shape.origin[0]-10, shape.origin[1]-10, width, height); 
    });
    this.done();
  });
	 Squid.shape(function() {
	   
		 this.name('Star');		 
		 this.states(['NoFill', 'HalfFill', 'Fill']);
		 this.color('#f00', '#f00');		 
     this.anchors([[-10,-20],[0,0], [20,5],[5,20],[0,40],[-15,20],[-35,15],[-15,0]]);
		 this.setDraw(function(shape) {	
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
	
   Squid.shape(function() {
    this.name('StraightLine');
    this.color('#00f', '#00f');
    this.prop('end', 'EndArrow');

    this.setDraw(function(shape){
      var shapedata = this.shapedata,
          shapes = this.shapes,
          s = shape.data,
          sl = s.length,
          osl = sl,
          ctx = this.ctx,
          dash = shape.dash;

      if(sl <= 1) {
        return;
      }
      
      ctx.save();
      ctx.translate(shape.origin[0], shape.origin[1]);
      ctx.beginPath();

      //Start at the last coordinate
      sl--
      var startpoint = s[sl];
      ctx.moveTo(startpoint[0], startpoint[1]);

      //For each coord in data
      while(sl--) {
         var a = s[sl];
         if(!Vector.isVector(a)) continue;

         //Dashzor
         if(dash) {
          if(sl == osl-2) {
            ctx.dashedLine(startpoint[0], startpoint[1], a[0], a[1], 5);
          } else {
            ctx.dashedLine(s[sl+1][0], s[sl+1][1], a[0], a[1], 5);
          }

          continue;
         }
        
         //Solid lienzor
         ctx.lineTo(a[0], a[1]);

      }
      ctx.stroke();
      ctx.restore();

      drawLib[shape.type.end].call(this, shape);
    });

    this.done();
   });

   Squid.shape(function(){
     this.name('FreehandLine');
     this.states(['Solid', 'Dashed']);
     this.color('#0f0', '#0f0');
     this.prop('end', 'EndArrow');

     this.setDraw(function(shape) {
       
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
      
      drawLib[shape.type.end].call(this, shape);
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
   
	 
  $('#Controls').click(function(evt){
    Squid.toggleControls();
  });

  $('#Line').click(function(evt) {
    Squid.setTool(Squid.tools.Line, 'StraightLine', true);
  });


  $('#Dynamic').click(function(evt) {
  //  Squid.setTool(Squid.tools.Line, 'StraightLine', true);
    Squid.setTool(Squid.tools.SingleTool, 'Circle', true);
  });
 })(Squid);
