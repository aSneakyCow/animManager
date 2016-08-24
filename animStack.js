//examples at bottom

var animating = false;
var cachedAnims = []; //all animations
var animStack = []; //cachedAnims currently being animated

class Sequence{
	constructor(vars, dur, description, loop){
		//might be nice to add properties and execute them based on whatever is passed, including functions. :)
		for(var i = 0; i <= vars.property.length - 1; i++){
			var prop = window.getComputedStyle(vars.element)[vars.property[i]];
			vars.default = [];
			if(prop.substr(0,3) === 'rgb'){
	    		vars.a = 1;
	    		vars.b, vars.c = 0;

				prop = rgbSplit(prop);
				if(vars.units == 'hsl'){
		    		vars.a = 1;
		    		vars.b, vars.c = 0;
					prop = rgbToHsl(prop[0], prop[1], prop[2]);
				} else if (vars.units == 'rgb') {
					// console.log(vars.default[i])
				}
				vars.default.push(prop);
			} else if (prop.substr(0,5) == 'matrix'){
				//not sure yet
			} else if (vars.property[i] == 'transform'){
				if (vars.transform[i].substr(0,5) == 'scale'){
					vars.default.push([1,1]);
					vars.units = '';
				} else {
				}
			} else {
				// vars.default.push(prop);
				vars.default.push(parseFloat(prop));
			}
		}

		this.vars = vars; //things, possibly dynamically added, that are needed by calculations instead of the stack maniger itself
		this.dur = dur;
		this.description = description;
		this.offset = 0;
		this.direction = 0;
		this.startTime = 0;
		this.firstFrame = true;
		this.reverse = false; //if the animation is in a refersed state
		this.reversed = false; //if the animation is in a refersed state
		this.loop = loop; //amount if times it should loop.
			//-1 means the animation begins has to return to the default stay after some point rather than loop
		this.count = 0; //times it's looped
		this.curveStart; //perform entire curve regardless of position or position animation on curve?
	};
};

function lin(x, vars){
	var y = (vars.scale * x) + vars.b;
	return y;
};

function quad(x, vars){
	x *= vars.scale;
	var y = (vars.a * Math.pow(x, vars.pow)) + (vars.b * x) + vars.c;
	// console.log(vars.property);
	return y;
};

Sequence.prototype.graph = function(progress){
	var pos;

	switch (this.vars.curve) {
	    case 'linear': pos = lin(progress, this.vars);
	        break;
	    case 
	    	'quad': pos = quad(progress, this.vars);
	        break;
	    // case 'circ':
	    //     pos = circ(progress);
	    // case 'custom':
	    //     pos = this.vars.customFunc(progress);
	}
	return pos;
};

Sequence.prototype.step = function step(change){
/*	when multiple animations are implemented, 
	all data accessing needs to be done at the same time 
	and data updates need to be done at the same time*/
	var total;

	if(this.vars.code){
		var exec = this.vars.code(this, change);
		exec()
	}

	for(var i = 0; i <= this.vars.property.length - 1; i++){
		if(this.vars.units == 'hsl' || this.vars.units == 'rgb'){
			var result = [];
			result[0] = change * (this.vars.color[0] - this.vars.default[i][0])+ this.vars.default[i][0];
			result[1] = change * (this.vars.color[1] - this.vars.default[i][1])+ this.vars.default[i][1];
			result[2] = change * (this.vars.color[2] - this.vars.default[i][2])+ this.vars.default[i][2];
			if( this.vars.units == 'hsl' ){
				result = hslToRgb(result[0], result[1], result[2]);
			} else if ( this.vars.units == 'rgb' ){
				result[0] = Math.round(result[0]);
				result[1] = Math.round(result[1]);
				result[2] = Math.round(result[2]);
			}
			total = "rgb("+result[0]+","+result[1]+","+result[2]+")";

		} else if (this.vars.property == 'transform'){
			var result = "";
			for(var j = 0; j <= this.vars.transformBy.length - 1; j++){
				var total = ( change * this.vars.transformBy[j] ) + this.vars.default[i][j];
				result = result + " " + total + this.vars.units;
				if(j < this.vars.transformBy.length - 1){
					result = result + ",";
				}
			} 
			result = this.vars.transform[0] + "(" + result + ")";
			total = result;

		} else {
			total = this.vars.default[i] + change + this.vars.units;
		}
		// console.log(total);
		this.vars.element.style[this.vars.property[i]] = total;
	}

	//don't like this
	if(this.firstFrame) delete this.firstFrame;
	if(this.reversed) delete this.reversed;
};

function animThink(){
	function animate(){
		var delta;
		var complete = true;
		for(var i = 0; i <= animStack.length - 1;i++){
			if(!animStack[i].reverse){
				if(animStack[i].direction < animStack[i].dur){
					animStack[i].direction = animStack[i].offset + (new Date - animStack[i].startTime);
					position = animStack[i].direction/animStack[i].dur;
				} else {
					continue; // skip everything else if at the end
				}
			} else { 
				animStack[i].direction = animStack[i].offset + (animStack[i].switchTime - new Date);
				position = animStack[i].direction/animStack[i].dur;
			}

			if(position < 0) position = 0;
			if(position > 1) position = 1;			

			//this is where curveStart needs to work 
			delta = animStack[i].graph(position);
			animStack[i].step(delta);  

			if(position < 1){
				//check if all animations are complete done;
				complete = false; 
			}
			//check if the animation is completed or if it has a triggered loop
			if (( position >= 1 && (animStack[i].loop >= 0)) ||
				(animStack[i].reverse == true && position == 0)) {
				//if animation is done remove it
				//update this so that animations aren't necessarily removed, may be smarter to cache em and remove one timers only
				animStack.splice(i, 1);
				i--;
			}
		}

		if(complete){
	        cancelAnimationFrame(globalID);
			animating = false; //unlock animation
		}
	  	globalID = requestAnimationFrame(animate)
	}

	/*	lock out other processes from starting animation
		animations run until all animations are completed
		and are started again when the first animation is added*/
	animating = true;
  	var globalID = requestAnimationFrame(animate)
}; 

// (function perma(){
// 	checkAnims();
// })();

//might become more complex if there's a need for different types of animations
function checkAnims(){
	if(!animating){
		if(animStack.length > 0){
			animThink();
		}
	} else {
		// console.log("Already animating");
	}
};

function reverseAnim(description){
	for(var i = 0; i <= animStack.length - 1; i++){
		if( description == animStack[i].description){
			animStack[i].switchTime = new Date;
			animStack[i].offset = animStack[i].direction;
			animStack[i].reverse = true;
			animStack[i].reversed = true;
			break;
		}  
	} 
}

//add animations or update an anim that can reverse itself
function addAnim(vars, dur, description, loop){
	var animation;
	
	if(animStack.length > 0){ 
		var found = false;
		//pop this onto the end if new anim is not on list;
		//might not be able to do this since I have to do it while animating
		for(var i = 0; i <= animStack.length - 1; i++){
			if( description == animStack[i].description){
				if(animStack[i].reverse){
					animStack[i].startTime = new Date; 
					animStack[i].offset = animStack[i].direction;
					animStack[i].reverse = false;
				}
				found = true;
				break;
			}  
		}
	} else {
		found = false;		
	}

	if(!found){
		animation = new Sequence(vars, dur, description, loop);

		animation.startTime = new Date; 
		animStack.push(animation);
		checkAnims(); 
	}
};

function updateAnim( anim, variable, update){
	for(var k = 0; k <= animStack.length - 1; k++){
		if( anim == animStack[k].description){ 
			animStack[k][variable] = update;
			if(variable == 'reverse'){
				animStack[k].switchTime = new Date;
				animStack[k].offset = animStack[k].direction;
				animStack[k].reverse = true;
				animStack[k].reversed = true;
			}
			break;
		}  
	}

}

////////////////////////->////////////////////////
// utilities that I may or may not have written //
////////////////////////->////////////////////////

function rgbSplit(colorString){
	colorsOnly = colorString.split("(");
	colorsOnly = colorsOnly[1].split(","); 
	colorsOnly[2] = colorsOnly[2].substring(0, colorsOnly[2].length - 1);

	colorsOnly[0] = parseFloat(colorsOnly[0]);
	colorsOnly[1] = parseFloat(colorsOnly[1]);
	colorsOnly[2] = parseFloat(colorsOnly[2]);

	return colorsOnly;
}

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbToHsl(r, g, b){
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

////////////////////////->////////////////////////
// todo											//
////////////////////////->////////////////////////
	//clean up repetition
	//might be better to not use loops at all and just assign numbers to animations with something like a c #define for their names and lookups no for looping, yay!

////////////////////////->////////////////////////
// esamples										//
////////////////////////->////////////////////////
// //color
// <header onmouseenter="addAnim({element: this, property: ['background-color'], color: [255, 255, 200], units:'hsl', curve: 'quad', scale: 1, a:100, b:0, pow:.25, c:0}, 3000, 'headerGlow')"  onmouseleave="reverseAnim('headerGlow')">
// //transform
// <div id = "topColumn" onmouseenter="addAnim({element: this, property: ['transform'], transform: ['translate', 30, 20], units:'px', curve: 'quad', scale: 1, a:50, b:0, pow:3, c:0}, 1000, 'topShuffle', -1)" onmouseleave="reverseAnim('topShuffle')">
// //other
// <div id = "leftColumn" onmouseenter="addAnim({element: this, property: ['left'], units:'%', curve: 'quad', scale: 1, a:50, b:0, pow:3, c:0}, 1000, 'leftPop', -1)" onmouseleave="reverseAnim('leftPop')"> 
