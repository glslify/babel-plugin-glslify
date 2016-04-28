var dirname = require('path').dirname
var glslifyHack = require('./lib/glslify-sync-hack')

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

  function evalConstant (env, path, expression) {
    if (!expression) {
      throw new Error('glslify-binding: invalid expression')
    }
    switch (expression.type) {
      case 'StringLiteral':
      case 'BooleanLiteral':
      case 'NumericLiteral':
      case 'NullLiteral':
        return expression.value
      case 'TemplateLiteral':
        var quasis = expression.quasis
        return expression.expressions.reduce(function (prev, expr, i) {
          prev.push(
            evalConstant(env, path, expr),
            quasis[i].value.cooked)
          return prev
        }, [quasis[0].value.cooked]).join('')
      case 'Identifier':
        // TODO handle __dirname and other constants here
        var binding = path.scope.getBinding(expression.name)
        if (!binding) {
          if (expression.name === '__dirname') {
            return env.cwd
          }
        }
        throw new Error('glslify-babel: cannot resolve glslify(), unknown id')
      case 'UnaryExpression':
        var value = evalConstant(env, path, expression.argument)
        switch (expression.operator) {
          case '+': return +value
          case '-': return -value
          case '!': return !value
          case '~': return ~value
          case 'typeof': return typeof value
          case 'void': return void value
        }
        throw new Error('glslify-babel: unsupported unary operator')
      case 'BinaryExpression':
        var left = evalConstant(env, path, expression.left)
        var right = evalConstant(env, path, expression.right)
        switch (expression.operator) {
          case '+': return left + right
          case '-': return left - right
          case '*': return left * right
          case '&': return left & right
          case '/': return left / right
          case '%': return left % right
          case '|': return left | right
          case '^': return left ^ right
          case '||': return left || right
          case '&&': return left && right
          case '<<': return left << right
          case '>>': return left >> right
          case '>>>': return left >>> right
          case '===': return left === right
          case '!==': return left !== right
          case '<': return left < right
          case '>': return right < left
          case '<=': return left <= right
          case '>=': return left >= right
        }
        throw new Error('glslify-babel: unsupported binary expression')
      case 'ObjectExpression':
        return expression.properties.reduce(function (result, property) {
          if (property.type !== 'ObjectProperty') {
            throw new Error('glslify-babel: expected object property')
          }

          var value = evalConstant(env, path, property.value)
          var key = property.key
          if (key.type === 'Identifier') {
            result[key.name] = value
          } else if (key.type === 'StringLiteral') {
            result[key.value] = value
          } else {
            throw new Error('glslify-babel: invalid property type')
          }
          return result
        }, {})
      case 'ArrayExpression':
        return expression.elements.map(function (prop) {
          if (!prop) {
            return void 0
          }
          return evalConstant(env, path, prop)
        })
      default:
        throw new Error('glslify-babel: cannot resolve glslify() call')
    }
  }

  return {
    visitor: {
      TaggedTemplateExpression: function (path, state) {
        var node = path.node
        var tag = node.tag
        if (tag.type !== 'Identifier' ||
            resolveModule(path, tag.name) !== 'glslify') {
          return
        }

        var filename = state.file.log.filename
        var cwd = dirname(filename)
        var env = {
          cwd: cwd
        }

        var stringInput = evalConstant(env, path, node.quasi)
        if (typeof stringInput !== 'string') {
          throw new Error('glslify-babel: invalid string template')
        }

        var result = glslifyHack(cwd, stringInput, { inline: true })
        path.replaceWith(babel.types.stringLiteral(result))
      },

      CallExpression: function (path, state) {
        var node = path.node
        var callee = node.callee
        if (callee.type !== 'Identifier' ||
            resolveModule(path, callee.name) !== 'glslify' ||
            node.arguments.length < 1) {
          return
        }

        var filename = state.file.log.filename
        var cwd = dirname(filename)
        var env = {
          cwd: cwd
        }

        var stringInput = evalConstant(env, path, node.arguments[0])
        if (typeof stringInput !== 'string') {
          throw new Error('glslify-babel: first argument must be a string')
        }

        var optionInput = {}
        if (node.arguments.length >= 2) {
          optionInput = evalConstant(env, path, node.arguments[1])
        }
        if (typeof optionInput !== 'object' || !optionInput) {
          throw new Error('glslify-babel: invalid option input')
        }

        var result = glslifyHack(cwd, stringInput, optionInput)
        path.replaceWith(babel.types.stringLiteral(result))
      }
    }
  }
}
