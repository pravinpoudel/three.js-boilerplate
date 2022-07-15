const _VS = `#version 300 es
precision highp float;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

in vec3 position;
in vec3 normal;

out vec3 vNormal;
out vec3 vPosition;

#define saturate(a) clamp( a, 0.0, 1.0 )

void main(){
    vNormal = normal;
    vPosition = position.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vPosition = gl_Position.xyz*vec3(0.5,0.5,0.5) + vec3(0.5,0.5,0.5);
  }
`;

const _FS = `#version 300 es

precision mediump sampler2DArray;
precision highp float;
precision highp int;

uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform vec3 cameraPosition;
uniform sampler2D diffuseTexture;

in vec3 vNormal;
in vec3 vPosition;

out vec4 out_FragColor;

vec3 blendNormal(vec3 normal){
	vec3 blending = abs(normal);
	blending = normalize(max(blending, 0.00001));
	blending /= vec3(blending.x + blending.y + blending.z);
	return blending;
}

vec3 triplanarMapping (sampler2D tex, vec3 normal, vec3 position) {
  vec3 normalBlend = blendNormal(normal);
  normalBlend = vec3(0.3, 0.3, 0.4);
  vec3 xColor = texture(tex, position.yz).rgb;
  vec3 yColor = texture(tex, position.xz).rgb;
  vec3 zColor = texture(tex, position.xy).rgb;
  return (xColor * normalBlend.x + yColor * normalBlend.y + zColor * normalBlend.z);
}

void main(){
    vec3 color = triplanarMapping(diffuseTexture, vNormal, vPosition);
    out_FragColor = vec4(color, 1.0);

  }
`;
export const terrainShader = { _VS, _FS };
