// var glslifySync = require('glslify-sync')

module.exports = function (babel) {
  function resolveImport (identifier, declaration) {
    if (declaration.type === 'ImportDeclaration' &&
        declaration.source &&
        declaration.source.type === 'StringLiteral') {
      return declaration.source.value
    }
    return ''
  }

  function resolveRequire (path, identifier, declaration) {
    if (declaration.type === 'VariableDeclaration') {
      var children = declaration.declarations
      for (var i = 0; i < children.length; ++i) {
        if (children[i].id === identifier) {
          var rhs = children[i].init
          if (rhs &&
              rhs.type === 'CallExpression' &&
              rhs.callee.type === 'Identifier' &&
              rhs.callee.name === 'require' &&
              !path.scope.getBinding('require') &&
              rhs.arguments.length === 1 &&
              rhs.arguments[0].type === 'StringLiteral') {
            return rhs.arguments[0].value
          }
        }
      }
    }
    return ''
  }

  function resolveModule (path, name) {
    var binding = path.scope.getBinding(name)
    if (!binding) {
      return ''
    }
    if (!binding.constant) {
      return ''
    }
    switch (binding.kind) {
      case 'module':
        return resolveImport(binding.identifier, binding.path.parent)

      case 'var':
      case 'let':
      case 'const':
        return resolveRequire(path, binding.identifier, binding.path.parent)

      default:
        return ''
    }
  }

  function evalConstant (path, expression) {
    if (!expression) {
      throw new Error('glslify-binding: invalid expression')
    }
    switch (expression.type) {
      case 'StringLiteral':
        return expression.value
      case 'Identifier':
        // TODO handle __dirname and other constants here
        throw new Error('glslify-babel: cannot resolve glslify(), unknown id')
      case 'BinaryExpression':
        if (expression.operator === '+') {
          return evalConstant(path, expression.left) +
                 evalConstant(path, expression.right)
        }
        throw new Error('glslify-babel: unsupported binary expression')
      default:
        throw new Error('glslify-babel: cannot resolve glslify() call')
    }
  }

  return {
    visitor: {
      CallExpression: function (path) {
        var node = path.node
        var callee = node.callee
        if (callee.type !== 'Identifier' ||
            resolveModule(path, callee.name) !== 'glslify' ||
            node.arguments.length < 1) {
          return
        }
        var stringInput = evalConstant(path, node.arguments[0])
        if (typeof stringInput !== 'string') {
          throw new Error('glslify-babel: first argument must be a string')
        }

        var optionInput = {}
        if (node.arguments.length >= 2) {
          optionInput = evalConstant(path, node.arguments[1])
        }
        if (typeof optionInput !== 'object' || !optionInput) {
          throw new Error('glslify-babel: invalid option input')
        }

        var result = 'GLSLIFY STRING'

        if (optionInput.inline) {
          // evaluate inline string
          result = optionInput.inline
        } else {
          // evaluate output
        }

        path.replaceWith(babel.types.stringLiteral(parsed))
      }
    }
  }
}
