var execFileSync = require('child_process').execFileSync
var path = require('path')

var SCRIPT_PATH = path.join(__dirname, 'exec-glslify')

module.exports = function (baseDir, stringInput, optionInput) {
  var args = [SCRIPT_PATH]

  var options = {
    cwd: baseDir,
    input: stringInput
  }

  if (optionInput.inline) {
    args.push('inline')
  }

  return execFileSync(process.argv[0], args, options).toString(0)
}
