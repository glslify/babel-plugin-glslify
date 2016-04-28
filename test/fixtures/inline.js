import glslify from 'glslify'

console.log(glslify(`
void main () {
  gl_FragColor = vec4(1, 0, 0, 1);
}
`, {
  inline: true
}))
