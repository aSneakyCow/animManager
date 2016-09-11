//examples at bottom
var animating = false;
var cachedAnims = []; //all animations
var animStack = []; //stores indexes of currently active cachedAnims. That's it. That's the whole thing.

var win = window;
var doc = document;

class Sequence {
	constructor(vars, dur){
		//might be nice to add properties and execute them based on whatever is passed, including functions. :)
		for(var i = 0; i <= vars.property.length - 1; i++){
			var prop = win.getComputedStyle(vars.element)[vars.property[i]];

			if(vars.default === undefined){
				vars.default = [];
				//probably need a getAnimType func
				if(prop.substr(0,3) === 'rgb'){
		    		vars.a = 1;
		    		vars.b, vars.c = 0;

					prop = rgbSplit(prop);
					if(vars.units == 'hsl'){
			    		vars.a = 1;
			    		vars.b, vars.c = 0;
						prop = rgbToHsl(prop[0], prop[1], prop[2]);
					} else if (vars.units == 'rgb') {
					}
					vars.default.push(prop);
				} else if (prop.substr(0,5) == 'matrix'){
					//not sure yet
				} else if (vars.property[i] == 'transform'){
					if (vars.transform[i].substr(0,5) == 'scale'){
						vars.default.push([1,1]);
						vars.units = '';
					} else {
						if(prop == 'none' || prop == 'undefined'){
							prop = [0,0];
						} else {
							var matrixRemove = prop.split("(");
							matrixRemove = matrixRemove[1].split(")"); 
							prop = matrixRemove[0].split(","); 	
							prop = [parseFloat(prop[4]), parseFloat(prop[5])]				
						}
						//need to check for 3d matrix and other types of transforms
						//matrix(scaleX(),skewY(),skewX(),scaleY(),translateX(),translateY())
						vars.default.push(prop);
					}
				} else {
					vars.default.push(parseFloat(prop));
				}
			} else {
				var temp = [];
				temp.push(vars.default);
				vars.default = temp;

				if(prop.substr(0,3) === 'rgb'){
					vars.element.style[vars.property[i]] = setColor(0, vars.color,  vars.default[i], vars.units );
					// console.log(vars.element.style[vars.property[i]]);
				} else if (vars.property[i] == 'transform'){
					vars.element.style[vars.property[i]] = setTransform(0, vars.transform[0], vars.transformBy.length, vars.transformBy[i], vars.default[i], vars.units );
					console.log(vars.element.style[vars.property[i]]);
				} else {
					vars.element.style[vars.property[i]] = setVal(0, vars.default[i], vars.units);
					// console.log(vars.element.style[vars.property[i]]);
				}
			}
		}

		if(!vars.delayFrac){
			vars.delayFrac = 0;
		} else {
			if (vars.delayFrac <= 0) vars.delayFrac = 0;
			if (vars.delayFrac >= 1) vars.delayFrac = 1;
		}

		this.vars = vars; //things, possibly dynamically added, that are needed by calculations instead of the stack maniger itself
		this.dur = dur;
		this.offset = 0;
		this.position = 0;
		this.oldPosition = 0;
		this.startTime = 0;
		this.reverse = false; //if the animation is in a refersed state
		this.directionChange = false; //if the animation is in a refersed state
		this.loop = 0; //amount if times it should loop.
			//-1 means the animation begins has to return to the default stay after some point rather than loop
		this.count = 0; //times it's looped
		this.curveStart; //perform entire curve regardless of position or position animation on curve?
		// this.= 0; //fraction of animation that animation should be delayed by
	};
}; 

(function getCachedAnims(){
	storeAnims();
})();
 
  
function lin(x, vars){
	var y = (vars.scale * x) + vars.b;
	return y;
};

function quad(x, vars){
	var y = vars.scale * ((vars.a * Math.pow(x, vars.pow)) + (vars.b * x) + vars.c);
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

function setColor( frac, targetColor, defColor, units ){
	var result = [];
	result[0] = frac * (targetColor[0] - defColor[0]) + defColor[0];
	result[1] = frac * (targetColor[1] - defColor[1]) + defColor[1];
	result[2] = frac * (targetColor[2] - defColor[2]) + defColor[2];
	if( units == 'hsl' ){
		//don't need to change it back, actually. just need to use hsl(,,)
		result = hslToRgb(result[0], result[1], result[2]);
	} else if ( units == 'rgb' ){
		result[0] = Math.round(result[0]);
		result[1] = Math.round(result[1]);
		result[2] = Math.round(result[2]);
	}

	return "rgb("+result[0]+","+result[1]+","+result[2]+")";
}

function setTransform(frac, type, transforms, targetTrans, trans, units){
	var result = "";
	for(var j = 0; j <= transforms - 1; j++){
		var total = ( frac * targetTrans[j] ) + trans[j];
		result = result + " " + total + units;
		if(j < transforms - 1){
			result = result + ",";
		}
	} 
	result = type + "(" + result + ")";
	return result;
}

function setVal(frac, def, units){
	return (def + frac) + units;
}


Sequence.prototype.step = function step(change){
/*	when multiple animations are implemented, 
	all data accessing needs to be done at the same time 
	and data updates need to be done at the same time*/
	var total;

	if(this.vars.code){
		var exec = this.vars.code;
		exec(this, change)
	}

	for(var i = 0; i <= this.vars.property.length - 1; i++){
		if(this.vars.units == 'hsl' || this.vars.units == 'rgb'){
			total = setColor( change, this.vars.color,  this.vars.default[i], this.vars.units );
		} else if (this.vars.property == 'transform'){
			//remove property and transform lengths. they should just be one value. any other animations based off of it can be done in the code or in another animation
			//transform[0], needs to be fixed. Figure out how multiple anims should be handled already
			total = setTransform(change, this.vars.transform[0], this.vars.transformBy.length, this.vars.transformBy, this.vars.default[i], this.vars.units );
		} else {
			total = setVal(change, this.vars.default[i], this.vars.units);
		}
		this.vars.element.style[this.vars.property[i]] = total;
		if(this.vars.postCode){
			var exec = this.vars.postCode;
			exec(this, change)
		}
	}

	if(this.firstFrame) this.firstFrame = false;
	if(this.directionChange) this.directionChange = false;
};


function playAnim(description){
	if(cachedAnims[description].position <= 0){
		cachedAnims[description].description = description;
		animStack.push(description)
	}
	cachedAnims[description].startTime = new Date;

	if(cachedAnims[description].reverse){
		cachedAnims[description].offset = cachedAnims[description].position;
		cachedAnims[description].reverse = false;
		cachedAnims[description].directionChange = true;
	}
	runAnims();
};


function updateAnim( anim, variable, update){
	cachedAnims[anim][variable] = update;
	if(variable == 'reverse'){
		cachedAnims[anim].switchTime = new Date;
		cachedAnims[anim].offset = cachedAnims[anim].position;
		cachedAnims[anim].reverse = true;
		cachedAnims[anim].directionChange = true;
	}
};

function runAnims(){
	if(!animating){
		if(animStack.length > 0){
			animThink();
		}
	} else {
	}
};  

function animThink(){
	function animate(){
		var delta;
		var complete = true;
		for(var i = 0; i <= animStack.length - 1;i++){
			if(cachedAnims[animStack[i]].vars.preCode){
				var exec = cachedAnims[animStack[i]].vars.preCode;
				exec(cachedAnims[animStack[i]], (cachedAnims[animStack[i]].position/cachedAnims[animStack[i]].dur))
			}

			cachedAnims[animStack[i]].oldPosition = cachedAnims[animStack[i]].position;

			if(cachedAnims[animStack[i]].position  <= 0){cachedAnims[animStack[i]].firstFrame = true;}

			if(!cachedAnims[animStack[i]].reverse){
				if(cachedAnims[animStack[i]].position < cachedAnims[animStack[i]].dur){
					cachedAnims[animStack[i]].position = cachedAnims[animStack[i]].offset + (new Date - cachedAnims[animStack[i]].startTime);
				} else {
					continue; // skip everything else if at the end
				}
			} else { 
				//position is not functioning correctly. 
				cachedAnims[animStack[i]].position = cachedAnims[animStack[i]].offset + (cachedAnims[animStack[i]].switchTime - new Date);
			}	

			if(cachedAnims[animStack[i]].position  <= 0){ cachedAnims[animStack[i]].position  = 0;}
			if(cachedAnims[animStack[i]].position  > cachedAnims[animStack[i]].dur) cachedAnims[animStack[i]].position = cachedAnims[animStack[i]].dur;	
			
			frac = cachedAnims[animStack[i]].position/cachedAnims[animStack[i]].dur;

			if(frac < 0) frac = 0;
			if(frac > 1) frac = 1;	

			// console.log(frac)
			if(frac >= cachedAnims[animStack[i]].vars.delayFrac){
				//this is where curveStart needs to work 
				delta = cachedAnims[animStack[i]].graph((frac- cachedAnims[animStack[i]].vars.delayFrac) * (1/(1 - cachedAnims[animStack[i]].vars.delayFrac)));
				cachedAnims[animStack[i]].step(delta);  
			}	
			frac = cachedAnims[animStack[i]].position/cachedAnims[animStack[i]].dur;

			if(frac < 1){
				//check if all animations are complete;
				complete = false; 
			}

			//check if the animation is completed or if it has a triggered loop
			if ((( frac >= 1 && (cachedAnims[animStack[i]].loop - cachedAnims[animStack[i]].count <= 0)) && !cachedAnims[animStack[i]].vars.biDirectional) ||
				(cachedAnims[animStack[i]].reverse == true && frac == 0)) {
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
};

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
};

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
};

////////////////////////->////////////////////////
// todo											//
////////////////////////->////////////////////////
	//more advanced curves
	//need a way to determine whether or not an animation has properties or is just a container for other animations

////////////////////////->////////////////////////
// esamples										//
////////////////////////->////////////////////////
// //color
// <header onmouseenter="addAnim({element: this, property: ['background-color'], color: [255, 255, 200], units:'hsl', curve: 'quad', scale: 1, a:100, b:0, pow:.25, c:0}, 3000, 'headerGlow')"  onmouseleave="reverseAnim('headerGlow')">
// //transform
// <div id = "topColumn" onmouseenter="addAnim({element: this, property: ['transform'], transform: ['translate', 30, 20], units:'px', curve: 'quad', scale: 1, a:50, b:0, pow:3, c:0}, 1000, 'topShuffle', -1)" onmouseleave="reverseAnim('topShuffle')">
// //other
// <div id = "leftColumn" onmouseenter="addAnim({element: this, property: ['left'], units:'%', curve: 'quad', scale: 1, a:50, b:0, pow:3, c:0}, 1000, 'leftPop', -1)" onmouseleave="reverseAnim('leftPop')"> 
