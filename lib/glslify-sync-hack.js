var execFileSync = require('child_process').execFileSync
var path = require('path')

var SCRIPT_PATH = path.join(__dirname, 'exec-glslify')

module.exports = function (baseDir, stringInput, optionInput) {
  var transforms = optionInput.transform || optionInput.transforms || []
  if (!Array.isArray(transforms)) {
    transforms = [transforms]
  }

  var glslifyInput = {
    transforms: transforms,
    baseDir: path.resolve(baseDir)
  }

  if (optionInput.inline) {
    glslifyInput.data = stringInput
  } else
  if ( stringInput.indexOf( '.' ) === 0 ){
    glslifyInput.filename = path.resolve(baseDir,stringInput)
  } else{
    glslifyInput.filename = path.resolve('node_modules', stringInput)
  }

  var options = {
    cwd: baseDir,
    input: JSON.stringify(glslifyInput)
  }

  return execFileSync(process.argv[0], [SCRIPT_PATH], options).toString(0)
}
