var glslifyBundle = require('glslify-bundle')
var glslifyDeps = require('glslify-deps')
var bl = require('bl')

var depper = glslifyDeps()

// TODO Apply source transforms
//    local
//    global
//    post
//
//  Syntax: depper.transform(tr)
//

//
// Build dependency tree, then output
process.stdin.pipe(bl(function (err, src) {
  if (err) {
    throw err
  }

  if (process.argv[2] === 'inline') {
    depper.inline(src, process.cwd(), output)
  } else {
    depper.add(src.toString(), output)
  }
}))

//
// Finally, apply shared functions for --post transforms
// and output the result to either stdout or the output
// file.
//
function output (err, tree) {
  if (err) throw err
  var src = String(glslifyBundle(tree))

 /*
  // Apply post transforms
  next()
  function next () {
    var tr = argv.p.shift()
    if (!tr) return done()
    var transform = require(tr)

    transform(null, src, {
      post: true
    }, function(err, data) {
      if (err) throw err
      if (data) src = data
      next()
    })
  }

  function done() {
    return process.stdout.write(src)
  }
  */

  process.stdout.write(src)
}
