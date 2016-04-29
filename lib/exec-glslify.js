var glslifyBundle = require('glslify-bundle')
var glslifyDeps = require('glslify-deps')
var bl = require('bl')

process.stdin.pipe(bl(function (err, src) {
  if (err) throw err

  var input = JSON.parse(src.toString())

  var depper = glslifyDeps()
  var postTransforms = []

  function applyTransform (transform) {
    if (!Array.isArray(transform)) {
      transform = [transform]
    }
    var name = transform[0]
    var opts = transform[1] || {}
    if (opts.post) {
      postTransforms.push([name, opts])
    } else {
      depper.transform(name, opts)
    }
  }

  // Handle transforms from options
  input.transforms.forEach(applyTransform)

  // TODO: Handle transforms from package.json

  // Call depper
  if (input.filename) {
    depper.add(input.filename, output)
  } else {
    depper.inline(input.data, input.baseDir, output)
  }

  // Apply post transforms, write result to stdout when finished
  function output (err, tree) {
    if (err) throw err
    next(err, String(glslifyBundle(tree)))
  }

  function next (err, src) {
    if (err) throw err
    var tr = postTransforms.shift()
    if (tr) {
      require(tr[0])(null, src, tr[1], next)
    } else {
      process.stdout.write(src)
    }
  }
}))
