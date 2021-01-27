import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

export default class Transform
{
	constructor(centerX, centerY)
	{
		this.translate = vec3.fromValues(centerX, centerY, 0);
		this.scale = vec3.fromValues(1, 1, 1);
		this.rotationAngle = 0;
		this.rotationAxis = vec3.fromValues( 0, 0, 1);

		this.modelTransformMatrix = mat4.create();
		mat4.identity(this.modelTransformMatrix);

		this.updateMVPMatrix();
	}

	getMVPMatrix()
	{
		return this.modelTransformMatrix;
	}

	updateMVPMatrix()
	{
		mat4.identity(this.modelTransformMatrix);
		mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, this.translate);
		mat4.rotate(this.modelTransformMatrix, this.modelTransformMatrix, this.rotationAngle, this.rotationAxis);
		mat4.scale(this.modelTransformMatrix, this.modelTransformMatrix, this.scale);
	}

	updateGlobalMVPMatrix()
	{
		mat4.identity(this.modelTransformMatrix);
		mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, this.translate);
		mat4.rotate(this.modelTransformMatrix, this.modelTransformMatrix, this.rotationAngle, this.rotationAxis);
		mat4.scale(this.modelTransformMatrix, this.modelTransformMatrix, this.scale);
		mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, vec3.fromValues(-this.translate[0], -this.translate[1],0));
	}

	setTranslate(translationVec)
	{
		vec3.copy(this.translate, translationVec);
	}

	getTranslate()
	{
		return this.translate;
	}

	setScale(scalingVec)
	{
		vec3.copy(this.scale, scalingVec);
	}

	getScale()
	{
		return this.scale[0];
	}

	setRotate(rotationAngle, rotationAxis)
	{
		this.rotationAngle = rotationAngle;
		vec3.copy(this.rotationAxis, rotationAxis);
	}

	getRotate()
	{
		return this.rotationAngle;
	}
}