var tape = require('tape')
var path = require('path')
var babel = require('babel-core')
var glslifyBabel = require('../glslify-babel')
var fs = require('fs')

tape('glslify-babel', function (t) {
  function runTestCase (fixture) {
    var filename = path.join(__dirname, 'fixtures', fixture)
    var source = fs.readFileSync(filename)
    var transformed = babel.transform(source, {
      filename: filename,
      presets: [
        'es2015'
      ],
      plugins: [
        glslifyBabel
      ]
    })

    // FIXME need to diff outputs here
    console.log(fixture, ':', transformed.code)
  }

  runTestCase('require.js')
  runTestCase('es6import.js')
  runTestCase('dirname.js')
  runTestCase('inline.js')

  t.end()
})
