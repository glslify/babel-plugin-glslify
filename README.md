glslify-babel
=============
A [babel](https://babeljs.io/) transform for [glslify](https://github.com/stackgl/glslify).

# Example
This module works the same as the browserify transform in [glslify](https://github.com/stackgl/glslify), except that it is compatible with babel.  It also supports ES6 syntax and some more advanced features like tagged strings.  For example, you can write something like this,

```javascript
import glsl from glslify;

const myFragShader = glsl`
#pragma glslify: noise = require(glsl-noise/simplex/2d)

void main () {
  float brightness = noise(gl_FragCoord.xy);
  gl_FragColor = vec4(vec3(brightness), 1.);
}
`;
```

# Configuration
To install this module, you need to install glslify as well:

```
npm i -S glslify glslify-babel
```

Then you need to configure babel to run the transform.  For example, if you were using browserify with babelify to run babel you would add the following to your package.json to run glslify:

```javascript
// ... in your package.json
"browserify": {
  "transform": [[
    "babelify", {
      "presets": ["es2015"],
      "plugins": ["glslify-babel"]
    }
  ]]
}
```

# License
(c) 2016 MIT License
