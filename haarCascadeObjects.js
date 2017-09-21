const ndarray = require("ndarray");

class faceRect {
	constructor(x1,y1,l,h) {
		this.x = x1;
		this.y = y1;
		this.length = l;
		this.height = h;
		this.center = [this.x + Math.floor(this.length/2),this.y + Math.floor(this.height/2)];
		this.cluster = 0;
	}
	crop(image) {
		var cropped = ndarray(new Float64Array(this.length*this.height*3), [this.length,this.height,3]);
		var X = this.x;
		var Y = this.y;
		for(var i = 0; i < this.length; i++) {
			Y = this.y;
			for(var j = 0; j < this.height; j++) {
				for(var k = 0; k < 3;k++) {
					cropped.set(i,j,k,image.get(X,Y,k));
				}
				Y++;
			}
			X++;
		}
		return cropped;
	}
}
class stage {
	constructor(threshold,trees) {
		this.threshold = threshold;
		this.tree = trees;
	}
	check(req,x,y,scale,integral,squaredIntegral) {
		var score = 0;
		this.tree.forEach(function(tree) {
			score += tree.score(req,x,y,scale,integral,squaredIntegral);
		});
		return (score > this.threshold);
	}
}
class tree {
	constructor(rectangles,threshold,left,right) {
		this.rectangle = rectangles;
		this.threshold = threshold;
		this.left = left;
		this.right = right;
	}
	score(req,x,y,scale,integral,squaredIntegral) {
		var widthOfWindow = Math.round(req.xml.size.x * scale);
		var heightOfWindow = Math.round(req.xml.size.y * scale);
		x = Math.round(x);
		y = Math.round(y);
		var mean = (integral.get(x + widthOfWindow, y + heightOfWindow) + integral.get(x, y) - integral.get(x,y + heightOfWindow) - integral.get(x + widthOfWindow, y)) / (widthOfWindow * heightOfWindow);
		var varianceSum = squaredIntegral.get(x + widthOfWindow, y + heightOfWindow) + squaredIntegral.get(x, y) - squaredIntegral.get(x,y + heightOfWindow) - squaredIntegral.get(x + widthOfWindow, y);
		var variance = (varianceSum / (widthOfWindow * heightOfWindow))-(mean * mean);
		if(variance > 1) {
			variance = Math.sqrt(variance);
		}else{
			variance = 1;
		}
		var sum = 0;
		this.rectangle.forEach(function(rectangle) {
			var x1 = x + Math.floor(scale * rectangle.x1);
			var y1 = y + Math.floor(scale * rectangle.x2);
			var x2 = x + Math.floor(scale * (rectangle.x1 + rectangle.y1));
			var y2 = y + Math.floor(scale * (rectangle.x2 + rectangle.y2));
			sum += (integral.get(x2, y2) + integral.get(x1, y1) - integral.get(x1,y2) - integral.get(x2, y1)) * rectangle.weight;
		});
		sum /= (widthOfWindow * heightOfWindow);
		if(this.threshold * variance > sum) {
			return this.left;
		}else{
			return this.right;
		}
	}
}
class rectangle {
	constructor(x1,x2,y1,y2,weight) {
		this.x1 = x1;
		this.x2 = x2;
		this.y1 = y1;
		this.y2 = y2;
		this.weight = weight;
	}
}

exports.faceRect = faceRect;
exports.stage = stage;
exports.tree = tree;
exports.rectangle = rectangle;