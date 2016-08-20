var animating = false;
var animStack = [];
var toRemove = 0;

class Sequence{
	constructor(dur, curve, vars, description, element){
		this.dur = dur;
		this.curve = curve;
		this.vars = vars;
		this.element = element;
		this.description = description;
		this.timescale = 1;
		this.progress = 0;
		this.delay = 0;
	};
};

function lin(x, vars){
	var y = (vars.m * x) + vars.b;
	return y;
};

function quad(x, vars){
	var y = (vars.a * Math.pow(progress, vars.p)) + (vars.b * x) + vars.c;
	return y;
};

Sequence.prototype.graph = function(progress){
	var pos;
	switch (this.curve) {
	    case 'linear':
	        pos = lin(progress, this.vars);
	        break;
	    case 'quad':
	        pos = quad(progress, this.vars);
	    // case 'circ':
	    //     pos = circ(progress);
	}
	return pos;
};

Sequence.prototype.step = function step(change){
	this.vars.property = 0;
	// console.log(this.vars.property);
	// console.log(this.progress);
};

(function perma(){
	checkAnims();
})();

function runAllAnimations(){
	animating = true;
  	if ( animStack.length > 0 ){
		var start = new Date;
		function animate(){
			var timePassed = new Date - start;
			var delta;
			var complete = true;
			var position = 0;
			function checkCompleted(){
				for(var i = 0; i <= animStack.length - 1; i++){
					if(animStack[i].progress < 1){
						animStack[i].progress = timePassed / animStack[i].dur;
						if(animStack[i].progress > 1) animStack[i].progress = 1;
						delta = animStack[i].graph(animStack[i].progress);
						animStack[i].step(delta);

						//check if we are still animating anything;
						if(animStack[i].progress < 1){
							complete = false; 
						} else {
							// console.log( animStack[i].description + " completed");
							// animStack[i] = animStack[i-1]; 
							// i--;
							// completed++;
						}
					}
				}
			}
			checkCompleted();

			//if all anims are done stop all redraws;
			if(complete){
				clearInterval(id);
			}
		}
	  	var id = setInterval(animate, 10);
	}
	animating = false;
};

//might become more complex;
function checkAnims(){
	// var count = 0;
	// timeout = 100;
	// function outStep(){
	// 	if(!animating){
	// 		animate();
	// 	}
	// }
	runAllAnimations();
	// var step = window.setInterval(animate, 100);
};

function addAnim(dur, curve, vars, description, element){
	var animation = new Sequence(dur, curve, vars, description, element);

	
	if(animStack.length == 0){ 
		animStack.push(animation);
		if(!animating){
			checkAnims();
		} else {
			console.log("Already animating");
		}
	}else{
		var found = false;
		/*later i need to check if I can do all of this from within one loop.
		 Just start animating, and push the new animation onto the end of the
		 stack if I reach the last item in the stack and the new animation 
		 isn't located there. Would be also nice to be able to delete variables 
		 while looping and changing animStack.Length*/
		for(var i = 0; i <= animStack.length - 1; i++){
			if( animation.description == animStack[i].description){
				found = true;
			}  

			if(animStack[i].progress == 1){
				if( i+1 < animStack.length){
					animStack[i] = animStack[i + 1];
				}

				//this is terrible. I just want it to work for now.
				for( var j = i; j <= animStack.length - 1; j++){

					console.log("j " + j + " " + animStack.length);
				}
			}
			// console.log(i + " " + animStack[i].description);
		}

		if(!found){
			animStack.push(animation);
			if(!animating){
				checkAnims();
			} else {
				console.log("Already animating");
			}
		}
	}
};
 