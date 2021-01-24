import { vec3, vec4, mat4 } from 'https://cdn.skypack.dev/gl-matrix';
import Shader from './shader.js';
import vertexShaderSrc from './vertex.js';
import fragmentShaderSrc from './fragment.js';
import Renderer from './renderer.js';
import Transform from './transform.js'
import Rectangle from './rectangle.js';
import Circle from './circle.js';

let controlBtn = document.getElementById('modeBtn');
let controlModeNames = ['Drawing','Instance-Transformation','Scene-Transformation'];
let shapeBtn = document.getElementById('shapeBtn');
let shapeNames = ['Rectangle','Square','Circle'];
let clearBtn = document.getElementById('clearBtn');


const renderer = new Renderer();
const gl = renderer.webGlContext();

const shader = new Shader(gl, vertexShaderSrc, fragmentShaderSrc);
shader.use();

const primitives = [];

let controlMode = 0;
let shapeMode = 0;

let currActiveElemIndex = -1;

const gui = new dat.GUI();

let translation = vec3.create();
let rotationAngle = 0;
let rotationAxis = vec3.create();
let scale = vec3.create();

let globCenterX = 0, globCenterY = 0;
let globalTransform = new Transform(0,0);
let sceneTransformMatrix = mat4.create();

const transformSettings = {
	translateX :0.0,
	translateY :0.0,
	scale :1.0,
	rotationAngle: 0
};

let tXCon = gui.add(transformSettings, 'translateX', -1.0, 1.0, 0.020001);
let tYCon = gui.add(transformSettings, 'translateY', -1.0, 1.0, 0.020001);
let scaleCon = gui.add(transformSettings, 'scale', 0.0, 2.0, 0.02);
let rotCon = gui.add(transformSettings, 'rotationAngle', -180, 180);
gui.hide();

// Convert mouse click to coordinate system as understood by webGL
renderer.getCanvas().addEventListener('click', (event) =>
{
	// captImageBtn.setAttribute('href', gl.canvas.toDataURL("image/jpeg", 1));
	
	let mouseX = event.clientX;
	let mouseY = event.clientY;

	let rect = renderer.getCanvas().getBoundingClientRect();
	mouseX = mouseX - rect.left;
	mouseY = mouseY - rect.top;

	const clipCoordinates = renderer.mouseToClipCoord(mouseX,mouseY);

	if(controlMode == 0 ){
		// console.log(clipCoordinates);

		if(shapeMode == 0)
			primitives.push( new Rectangle(gl, clipCoordinates[0], clipCoordinates[1], 100, 200, [1,0,0]) );
		else if(shapeMode == 1)
			primitives.push( new Rectangle(gl, clipCoordinates[0], clipCoordinates[1], 120, 120, [1,0,1]) );
		else if(shapeMode == 2)
			primitives.push( new Circle(gl, clipCoordinates[0], clipCoordinates[1], 50, [0,0,1], 32) );

	}else if(controlMode == 1 && primitives.length>0){

		if(currActiveElemIndex != -1){
			primitives[currActiveElemIndex].resetColor();
		}
		currActiveElemIndex = -1;
		let tempIndex = -1;

		// Selects Active element on basis of shortest distance from element center 
		// let minDist = 100000;
		// primitives.forEach(function(primitive, index, arr){
		// 	console.log(primitive.constructor.name);
		// 	let dist = Math.pow(primitive.getPos(0) - clipCoordinates[0],2) + 
		// 				Math.pow(primitive.getPos(1) - clipCoordinates[1],2);
		// 	if(dist < minDist){
		// 		minDist = dist;
		// 		tempIndex = index;
		// 	}
		// });


		// Selects Active element according to the element outline
		let tempMatrix = mat4.create();
		let mouseCoordVec4 = vec4.fromValues(clipCoordinates[0], clipCoordinates[1],0 ,1);
		primitives.forEach(function(primitive, index, arr){
			if(primitive.constructor.name === 'Rectangle'){
				mat4.identity(tempMatrix);
				mat4.scale(tempMatrix, tempMatrix, vec3.fromValues(1/primitive.transform.getScale(), 1/primitive.transform.getScale(), 1/primitive.transform.getScale()));
				mat4.rotate(tempMatrix, tempMatrix, -primitive.transform.getRotate(), vec3.fromValues(0,0,1));
				mat4.translate(tempMatrix, tempMatrix, vec3.fromValues(-primitive.getPos(0), -primitive.getPos(1), 0));

				mat4.multiply(tempMatrix, tempMatrix, mouseCoordVec4);

				// console.log(tempMatrix);
				if(tempMatrix[0] > -primitive.width/2 && tempMatrix[0] < primitive.width/2 &&
					tempMatrix[1] > -primitive.height/2 && tempMatrix[1] < primitive.height/2){
					tempIndex = index;
				}
			}else if(primitive.constructor.name === 'Circle'){
				if( Math.pow(primitive.getPos(0) - clipCoordinates[0],2) + 
						Math.pow(primitive.getPos(1) - clipCoordinates[1],2) < Math.pow(primitive.radius, 2))
					tempIndex = index;
			}
		});
		if(tempIndex == -1)	return;

		primitives[tempIndex].setColor([0,1,0]);

		// console.log(primitives[tempIndex]);

		tXCon.setValue(primitives[tempIndex].transform.getTranslate()[0]);
		tYCon.setValue(primitives[tempIndex].transform.getTranslate()[1]);
		scaleCon.setValue(primitives[tempIndex].transform.getScale());
		rotCon.setValue(primitives[tempIndex].transform.getRotate() * 180 / Math.PI);
		currActiveElemIndex = tempIndex;
	}else if(controlMode == 2 && primitives.length > 0){
		
		
	}
});

window.addEventListener('keydown', function (event){
	switch(event.key){
		case 'r':
			shapeMode = 0;
			break;
		case 's':
			shapeMode = 1;
			break;
		case 'c':
			shapeMode = 2;
			break;
		case 'm':
			changeControlMode();
			break;
		case 'x':
		case "Delete":
			if(controlMode == 1 && currActiveElemIndex!=-1){
				primitives.splice(currActiveElemIndex,1);
				currActiveElemIndex = -1;
			}
			break;
		case "Escape":
			window.location = window.location;
			break;

		case "ArrowUp":
			tYCon.setValue(tYCon.getValue() + 0.02);
			break;
		case "ArrowDown":
			tYCon.setValue(tYCon.getValue() - 0.02);
			break;
		case "ArrowLeft":
			if(controlMode == 1)
				tXCon.setValue(tXCon.getValue() - 0.02);
			else
				rotCon.setValue(rotCon.getValue() + 5);
			break;
		case "ArrowRight":
			if(controlMode == 1)
				tXCon.setValue(tXCon.getValue() + 0.02);
			else
				rotCon.setValue(rotCon.getValue() - 5);
			break;

		case "+":
			scaleCon.setValue(scaleCon.getValue() * 1.1);
			break;
		case "-":
			scaleCon.setValue(scaleCon.getValue() * 0.9);
			break;


	}
	shapeBtn.innerHTML = 'Shape : ' + shapeNames[shapeMode];
}, true);

modeBtn.addEventListener("click", changeControlMode); 
shapeBtn.addEventListener("click", changeShapeMode); 
clearBtn.addEventListener("click", clearCanvas); 
// captImageBtn.addEventListener("click", function(){
// 	captImageBtn.setAttribute('href', gl.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
// });


function changeControlMode(){
	if(currActiveElemIndex != -1){
		primitives[currActiveElemIndex].resetColor();
		currActiveElemIndex = -1;
	}
	controlMode = (controlMode + 1) % 3;
	modeBtn.innerHTML = 'Control Mode : ' + controlModeNames[controlMode];
	if(controlMode == 0){
		shapeBtn.style.display = '';
		gui.hide();
	}else if(controlMode == 1){
		shapeBtn.style.display = 'none';
		gui.show();
	}else{
		globCenterX = 0;
		globCenterY = 0;
		let minX = 100, maxX = -100, minY = 100, maxY = -100;
		primitives.forEach(function(primitive, index, arr){
			// globCenterX += primitive.getPos(0);
			// globCenterY += primitive.getPos(1);

			if (minX > primitive.getPos(0)) {
				minX = primitive.getPos(0);
			}
			if (maxX < primitive.getPos(0)) {
				maxX = primitive.getPos(0);
			}
			if (minY > primitive.getPos(1)) {
				minY = primitive.getPos(1);
			}
			if (maxY < primitive.getPos(1)) {
				maxY = primitive.getPos(1);
			}
		});
		// globCenterX/= primitives.length;
		// globCenterY/= primitives.length;

		globCenterX = (minX + maxX)/2;
		globCenterY = (minY + maxY)/2;
		console.log(globCenterX, globCenterY);

		globalTransform.setTranslate(vec3.fromValues(globCenterX, globCenterY, 0));

		tXCon.setValue(globalTransform.getTranslate()[0]);
		tYCon.setValue(globalTransform.getTranslate()[1]);
		scaleCon.setValue(globalTransform.getScale());
		rotCon.setValue(globalTransform.getRotate() * 180 / Math.PI);
		shapeBtn.style.display = 'none';
		gui.show();
	}
}

function changeShapeMode(){
	shapeMode = (shapeMode + 1) % 3;
	shapeBtn.innerHTML = 'Shape : ' + shapeNames[shapeMode];
}

function clearCanvas(){
	primitives.splice(0, primitives.length);
}

//Draw loop
function animate()
{
	renderer.clear();
	if(controlMode == 2 && primitives.length > 0){
			// vec3.set(translation, tXCon.getValue(), tYCon.getValue(), 0);
			// globalTransform.setTranslate(translation);

			globalTransform.setRotate(rotCon.getValue() * Math.PI / 180, vec3.fromValues(0, 0, 1));

			let scaleGUIValue = scaleCon.getValue();
			vec3.set(scale, scaleGUIValue, scaleGUIValue, 1);
			globalTransform.setScale(scale);

			globalTransform.updateGlobalMVPMatrix();

			sceneTransformMatrix = globalTransform.getMVPMatrix();
			// console.log(globalTransform);
	}	
	primitives.forEach(function(primitive, index, arr){
		// console.log(primitives.length);
		if(controlMode == 1 && index == currActiveElemIndex){

			vec3.set(translation, tXCon.getValue(), tYCon.getValue(), 0);
			primitive.transform.setTranslate(translation);

			primitive.transform.setRotate(rotCon.getValue() * Math.PI / 180, vec3.fromValues(0,0,1));

			let scaleGUIValue = scaleCon.getValue();
			vec3.set(scale, scaleGUIValue, scaleGUIValue, 1);
			primitive.transform.setScale(scale);

			primitive.transform.updateMVPMatrix();

		}
		if(controlMode == 2)
			primitive.draw(shader, sceneTransformMatrix);
		else
			primitive.draw(shader, mat4.create());
	
	});
	window.requestAnimationFrame(animate);
}

animate();
shader.delete();