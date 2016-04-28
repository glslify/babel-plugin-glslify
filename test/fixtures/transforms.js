import glsl from 'glslify'

console.log(glsl(`
void main () {
  gl_FragColor = #ff0000;
}`, {
  inline: true,
  transform: ['glslify-hex']
}))
