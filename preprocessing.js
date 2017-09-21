const ndarray = require("ndarray"),
	  fs = require("fs"),
	  libxmljs = require("libxmljs"),
	  obj = require("./haarCascadeObjects");

function grayscalePhoto(req) {
	grayscale = ndarray(new Float64Array(req.pixels.shape[0]*req.pixels.shape[1]), [req.pixels.shape[0],req.pixels.shape[1]]);
	for(var i = 0; i < req.pixels.shape[0]; i++) {
		for(var j = 0; j < req.pixels.shape[1]; j++) {
			if(req.pixels.shape[2] == 4 && req.pixels.get(i,j,3) == 0) {
				grayscale.set(i,j,255);
			}else{
				var red = req.pixels.get(i,j,0);
				var green = req.pixels.get(i,j,1);
				var blue = req.pixels.get(i,j,2);
				grayscale.set(i,j,Math.round(Number((30 * red + 59 * green + 11 * blue)/100)));
			}
		}
	}
	return grayscale;
}

function integralPhoto(req) {
	integral = ndarray(new Float64Array(req.pixels.shape[0]*req.pixels.shape[1]), [req.pixels.shape[0],req.pixels.shape[1]]);
	for(var i = 0; i < req.pixels.shape[0]; i++) {
		var totalAbove = 0;
		for(var j = 0; j < req.pixels.shape[1]; j++) {
			var value = req.grayscale.get(i,j);
			value += totalAbove;
			if(i!=0) {
				value += integral.get(i-1,j);
			}
			integral.set(i,j,value);
			totalAbove+=req.grayscale.get(i,j);
		}
	}
	return integral;
}

function squaredIntegralPhoto(req) {
	squared = ndarray(new Float64Array(req.pixels.shape[0]*req.pixels.shape[1]), [req.pixels.shape[0],req.pixels.shape[1]]);
	for(var i = 0; i < req.pixels.shape[0]; i++) {
		var totalAbove = 0;
		for(var j = 0; j < req.pixels.shape[1]; j++) {
			var value = req.grayscale.get(i,j);
			value *= value;
			value += totalAbove;
			if(i!=0) {
				value += squared.get(i-1,j);
			}
			squared.set(i,j,value);
			totalAbove+=req.grayscale.get(i,j) * req.grayscale.get(i,j);
		}
	}
	return squared;
}

function populateStages(filename) {
	var xmlFile = fs.readFileSync(__dirname + "//" + filename,"utf8");
	var parse = libxmljs.parseXml(xmlFile);
    var xml = new Object();
    var size = parse.find("//size")[0].text();
    var seperator = size.indexOf(" ");
    var sizex = parseInt(size.substring(0,seperator));
    var sizey = parseInt(size.substring(seperator + 1));
	xml.size = {
		"x":sizex,
		"y":sizey
	};
	var parseStages = parse.find("//stages/_");
	var stages = [];
	parseStages.forEach(function(stage) {
		var trees = stage.find(stage.path() + "/trees/_/_");
		var stage_threshold = parseFloat(stage.get(stage.path() + "/stage_threshold").text());
		var treeObjects = [];
		trees.forEach(function(tree) {
			var tree_threshold = parseFloat(tree.get(tree.path() + "/threshold").text());
			var left_val = parseFloat(tree.get(tree.path() + "/left_val").text());
			var right_val = parseFloat(tree.get(tree.path() + "/right_val").text());
			var rectangles = tree.find(tree.path() + "/feature/rects/_");
			var rectangleObjects = [];
			rectangles.forEach(function(rectangle) {
				var str = rectangle.text();
				var strArray = str.split(" ");
				var x1 = parseInt(strArray[0]);
				var x2 = parseInt(strArray[1]);
				var y1 = parseInt(strArray[2]);
				var y2 = parseInt(strArray[3]);
				var weight = parseInt(strArray[4]);
				rectangleObjects.push(new obj.rectangle(x1,x2,y1,y2,weight));
			});
			treeObjects.push(new obj.tree(rectangleObjects,tree_threshold,left_val,right_val));
		});
	stages.push(new obj.stage(stage_threshold,treeObjects));});
	xml.stage = stages;
	return xml;
}

function getEdges(req) {
	var gaussian = ndarray(new Array(req.pixels.shape[0]*req.pixels.shape[1]).fill(0), [req.pixels.shape[0],req.pixels.shape[1]]);
	for(var i = 2;i < gaussian.shape[0] - 2;i++) {
		for(var j = 2;j < gaussian.shape[1] - 2.;j++) {
			var sum = 4 * req.grayscale.get(i-2,j-1) + 
				  5 * req.grayscale.get(i-2,j+0) + 
				  4 * req.grayscale.get(i-2,j+1) +
				  2 * req.grayscale.get(i-2,j+2) +
				  4 * req.grayscale.get(i-1,j-2) +
				  9 * req.grayscale.get(i-1,j-1) +
				  12 *req.grayscale.get(i-1,j+0) +
				  9 * req.grayscale.get(i-1,j+1) + 
				  4 * req.grayscale.get(i-1,j+2) +
				  5 * req.grayscale.get(i+0,j-2) + 
				  12 *req.grayscale.get(i+0,j-1) + 
				  15 *req.grayscale.get(i+0,j+0) +
				  12 *req.grayscale.get(i+0,j+1) + 
				  5 * req.grayscale.get(i+0,j+2) + 
				  4 * req.grayscale.get(i+1,j-2) +
				  9 * req.grayscale.get(i+1,j-1) +
				  12 *req.grayscale.get(i+1,j+0) +
				  9 * req.grayscale.get(i+1,j+1) +
				  4 * req.grayscale.get(i+1,j+2) +
				  2 * req.grayscale.get(i+2,j-2) +
				  4 * req.grayscale.get(i+2,j-1) +
				  5 * req.grayscale.get(i+2,j+0) +
				  4 * req.grayscale.get(i+2,j+1) +
				  2 * req.grayscale.get(i+2,j+2);
			gaussian.set(i,j,Math.floor(sum/159));
			//console.log(i + " " + j + " " + sum);
		}
	}
	var edgeGradient = ndarray(new Float64Array(req.pixels.shape[0]*req.pixels.shape[1]), [req.pixels.shape[0],req.pixels.shape[1]]);
	for(var i = 1; i < gaussian.shape[0] - 1; i++) {
		for(var j = 1; j < gaussian.shape[1] - 1; j++) {
			var gradient_x = Math.abs(gaussian.get(i+1,j-1) + 
							 2 * gaussian.get(i+1,j) + 
							 gaussian.get(i+1,j+1) -  
							 gaussian.get(i-1,j-1) - 
							 2 * gaussian.get(i-1,j) - 
							 gaussian.get(i-1,j+1));
			var gradient_y = Math.abs(gaussian.get(i-1,j+1) + 
							 gaussian.get(i,j+2) + 
							 gaussian.get(i+1,j-1) - 
							 gaussian.get(i-1,j+1) - 
							 2 * gaussian.get(i,j+1) - 
							 gaussian.get(i+1,j+1));
			edgeGradient.set(i,j,gradient_x+gradient_y);
			//console.log(i + " " + j + " " + edgeGradient.get(i,j));
		}
	}
	var gradientIntegral = ndarray(new Float64Array(req.pixels.shape[0]*req.pixels.shape[1]), [req.pixels.shape[0],req.pixels.shape[1]]);
	for(var i = 0; i < edgeGradient.shape[0]; i++) {
		var totalAbove = 0;
		for(var j = 0; j < edgeGradient.shape[1]; j++) {
			var value = edgeGradient.get(i,j);
			value += totalAbove;
			if(i!=0) {
				value += gradientIntegral.get(i-1,j);
			}
			gradientIntegral.set(i,j,value);
			totalAbove+=edgeGradient.get(i,j);
			//console.log(i + " " + j + " " + gradientIntegral.get(i,j));
		}
	}
	return gradientIntegral;
}

exports.getEdges = getEdges;
exports.populateStages = populateStages;
exports.squaredIntegralPhoto = squaredIntegralPhoto;
exports.integralPhoto = integralPhoto;
exports.grayscalePhoto = grayscalePhoto;