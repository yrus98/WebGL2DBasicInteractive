import { vec3, vec4, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

import Transform from './transform.js';

export default class Rectangle
{
	constructor(gl, centerX, centerY, width, height, color)
	{
		this.centerX = centerX;
		this.centerY = centerY;
		this.width = 2 * width/gl.canvas.width;
		this.height = 2 * height/gl.canvas.height;
		this.color = color;
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
		this.vertexAttributesData = new Float32Array([
			//  x , y,  z , r , g , b
			- this.width/2, this.height/2, 0.0, color[0], color[1], color[2],
			 this.width/2, this.height/2, 0.0, color[0], color[1], color[2],
			- this.width/2, - this.height/2, 0.0, color[0], color[1], color[2],
			 this.width/2, - this.height/2, 0.0, color[0], color[1], color[2],
		]);
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
		let tempMatrix = mat4.create();
		for (let i = 0; i < 4; i++) {

			let tempVec = vec4.fromValues(this.vertexAttributesData[i * 6], this.vertexAttributesData[i * 6 + 1], 0, 1);
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