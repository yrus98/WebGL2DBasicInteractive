import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

import Transform from './transform.js';

export default class Circle
{
	constructor(gl, centerX, centerY, radius, color, lod)
	{
		this.centerX = centerX;
		this.centerY = centerY;
		this.radius = 2 * radius/gl.canvas.width;
		this.color = color;
		this.lod = lod;
		this.vertexAttributesData = new Float32Array();
		this.gl = gl;

		this.vertexAttributesBuffer = this.gl.createBuffer();
		if (!this.vertexAttributesBuffer)
		{
			throw new Error("Buffer for vertex attributes could not be allocated");
		}

		this.transform = new Transform(this.centerX, this.centerY);
		this.resetColor();
	}

	draw(shader, sceneTransformMatrix)
	{
		const uModelTransformMatrix = shader.uniform("uModelTransformMatrix");
		const uSceneTransformMatrix = shader.uniform("uSceneTransformMatrix");

		let elementPerVertex = 3;

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexAttributesBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexAttributesData, this.gl.DYNAMIC_DRAW);

		const aPosition = shader.attribute("aPosition");
		this.gl.enableVertexAttribArray(aPosition);
		this.gl.vertexAttribPointer(aPosition, elementPerVertex, this.gl.FLOAT, false, 6 * this.vertexAttributesData.BYTES_PER_ELEMENT, 0);

		const aColor = shader.attribute("aColor");
		this.gl.enableVertexAttribArray(aColor);
		this.gl.vertexAttribPointer(aColor, elementPerVertex, this.gl.FLOAT, false, 6 * this.vertexAttributesData.BYTES_PER_ELEMENT, 3 * this.vertexAttributesData.BYTES_PER_ELEMENT);
		
		shader.setUniformMatrix4fv(uModelTransformMatrix, this.transform.getMVPMatrix());
		
		shader.setUniformMatrix4fv(uSceneTransformMatrix, sceneTransformMatrix);

		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.vertexAttributesData.length / (2 * elementPerVertex));
	}

	setColor(color){
		let temp = [];
		let thetaIncr = 2*Math.PI / this.lod;
		for (let i = 0; i < this.lod; i++) {
			temp = temp.concat([this.radius * Math.cos(i * thetaIncr), this.radius * Math.sin(i * thetaIncr), 0]);
			temp = temp.concat(color);
			temp = temp.concat([0,0,0]);
			temp = temp.concat(color);
		}

		temp = temp.concat([this.radius, 0, 0]);
		temp = temp.concat(color);

		this.vertexAttributesData = new Float32Array(temp);
	}

	resetColor(){
		this.setColor(this.color);
	}

	addVertex(position, color)
	{
		this.vertexAttributesData = new Float32Array([...this.vertexAttributesData, ...position, ...color])
	}

	getPos(i){
		return this.transform.getTranslate()[i];
	}

	getBoundaries(){
		let minX = 1000, maxX = -1000, minY = 1000, maxY = -1000;
		let edgeVertices = [this.radius, 0, 
							0, this.radius,
							-this.radius, 0,
							0, -this.radius];
		let tempMatrix = mat4.create();
		for (let i = 0; i < 4; i++) {

			let tempVec = vec4.fromValues(edgeVertices[2 * i], edgeVertices[i * 2 + 1], 0, 1);
			mat4.multiply(tempMatrix, this.transform.getMVPMatrix(), tempVec);
			
			if(minX > tempMatrix[0]){
				minX = tempMatrix[0];
			}
			if(maxX < tempMatrix[0]){
				maxX = tempMatrix[0];
			}
			if(minY > tempMatrix[1]){
				minY = tempMatrix[1];
			}
			if(maxY < tempMatrix[1]){
				maxY = tempMatrix[1];
			}
		}

		return [minX, maxX, minY, maxY];
	}
}