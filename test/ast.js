const { assert } = require('chai')
const parser = require('../src/index')
const {
  parseContract,
  parseNode,
  parseStatement,
  parseExpression,
  parseAssembly
} = require('./utils')

describe('AST', () => {

  it("SourceUnit", function() {
    var ast = parser.parse("");
    assert.deepEqual(ast, {
      "type": "SourceUnit",
      "children": []
    });
  })

  it("EnumDefinition / EnumValue", function() {
    var ast = parseNode("enum Hello { A, B, C }")
    assert.deepEqual(ast, {
      "type": "EnumDefinition",
      "name": "Hello",
      "members": [
        {
          "type": "EnumValue",
          "name": "A"
        },
        {
          "type": "EnumValue",
          "name": "B"
        },
        {
          "type": "EnumValue",
          "name": "C"
        }
      ]
    })
  })

  it("UsingForDeclaration", function() {
    var ast = parseNode("using Lib for uint;")
    assert.deepEqual(ast, {
      "type": "UsingForDeclaration",
      "typeName": {
          "type": "ElementaryTypeName",
          "name": "uint"
        },
      "libraryName": "Lib"
    })

    ast = parseNode("using Lib for *;")
    assert.deepEqual(ast, {
      "type": "UsingForDeclaration",
      "typeName": null,
      "libraryName": "Lib"
    })

    ast = parseNode("using Lib for S;")
    assert.deepEqual(ast, {
      "type": "UsingForDeclaration",
      "typeName": {
          "type": "UserDefinedTypeName",
          "namePath": "S"
        },
      "libraryName": "Lib"
    })

  })

  it("PragmaDirective", function() {
    var ast = parser.parse("pragma solidity ^0.4.0;")
    var pragma = ast.children[0]
    assert.deepEqual(pragma, {
      "type": "PragmaDirective",
      "name": "solidity",
      "value": "^0.4.0"
    })
  })

  it("ContractDefinition", function() {
    var ast = parseContract("contract test {}")
    assert.deepEqual(ast, {
      "type": "ContractDefinition",
      "name": "test",
      "natspec": null,
      "baseContracts": [],
      "subNodes": [],
      "kind": "contract"
    })

    // inheritance
    ast = parseContract("contract test is foo, bar {}")
    assert.deepEqual(ast, {
      "type": "ContractDefinition",
      "name": "test",
      "natspec": null,
      "baseContracts": [
        {
          "type": "InheritanceSpecifier",
          "baseName": {
            "type": "UserDefinedTypeName",
            "namePath": "foo"
          },
          "arguments": []
        },
        {
          "type": "InheritanceSpecifier",
          "baseName": {
            "type": "UserDefinedTypeName",
            "namePath": "bar"
          },
          "arguments": []
        }
      ],
      "subNodes": [],
      "kind": "contract"
    })

    // library
    ast = parseContract("library test {}")
    assert.deepEqual(ast, {
      "type": "ContractDefinition",
      "name": "test",
      "natspec": null,
      "baseContracts": [],
      "subNodes": [],
      "kind": "library"
    })

    // interface
    ast = parseContract("interface test {}")
    assert.deepEqual(ast, {
      "type": "ContractDefinition",
      "name": "test",
      "natspec": null,
      "baseContracts": [],
      "subNodes": [],
      "kind": "interface"
    })
  })

  it('FunctionDefinition constructor case', () => {
    var ast = parseNode("constructor(uint a) public {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": null,
      "parameters": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "public",
      "modifiers": [],
      "override": null,
      "isConstructor": true,
      "isFallback": false,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": null,
    })
  })

  it('FunctionDefinition fallback case', () => {
    var ast = parseNode("fallback () external {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": null,
      "parameters": [],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "external",
      "modifiers": [],
      "override": null,
      "isConstructor": false,
      "isFallback": true,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": null,
    })
  })

  it('FunctionDefinition fallback old definition', () => {
    var ast = parseNode("function () external {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": '',
      "parameters": [],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "external",
      "modifiers": [],
      "override": null,
      "isConstructor": false,
      "isFallback": true,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": null,
    })
  })

  it('FunctionDefinition fallback case missing "external" decorator throws', () => {
    assert.throws(
      () => parseNode("fallback () {}"),
      Error,
      'Fallback functions have to be declared "external"'
    );
  })

  it('FunctionDefinition fallback case with parameters throws', () => {
    assert.throws(
      () => parseNode("fallback (uint256 myUint) external {}"),
      Error,
      'Fallback functions cannot have parameters'
    );
  })

  it('FunctionDefinition fallback case with return parameters throws', () => {
    assert.throws(
      () => parseNode("fallback () external returns (uint256 myUint) {}"),
      Error,
      'Fallback functions cannot have return parameters'
    );
  })

  it('FunctionDefinition receive ether case', () => {
    var ast = parseNode("receive () external payable {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": null,
      "parameters": [],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "external",
      "modifiers": [],
      "override": null,
      "isConstructor": false,
      "isFallback": false,
      "isReceiveEther": true,
      "isVirtual": false,
      "stateMutability": "payable",
    })
  })

  it('FunctionDefinition receive ether case missing "external" decorator throws', () => {
    assert.throws(
      () => parseNode("receive () payable {}"),
      Error,
      'Receive Ether functions have to be declared "external"');
  })

  it('FunctionDefinition receive ether case missing "payable" decorator throws', () => {
    assert.throws(
      () => parseNode("receive () external {}"),
      Error,
      'Receive Ether functions have to be declared "payable"');
  })

  it('FunctionDefinition receive ether case with parameters throws', () => {
    assert.throws(
      () => parseNode("receive (uint256 myUint) external payable {}"),
      Error,
      'Receive Ether functions cannot have parameters');
  })

  it('FunctionDefinition receive ether case with return parameters throws', () => {
    assert.throws(
      () => parseNode("receive () external payable returns (uint256 myUint) {}"),
      Error,
      'Receive Ether functions cannot have return parameters');
  })

  it('FunctionDefinition with override', () => {
    var ast = parseNode("function foo() public override {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": "foo",
      "parameters": [],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "public",
      "modifiers": [],
      "override": [],
      "isConstructor": false,
      "isFallback": false,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": null,
    })
  })

  it('FunctionDefinition with one explicit override', () => {
    var ast = parseNode("function foo() public override(Base) {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": "foo",
      "parameters": [],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "public",
      "modifiers": [],
      "override": [{
        "type": "UserDefinedTypeName",
        "namePath": "Base"
      }],
      "isConstructor": false,
      "isFallback": false,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": null,
    })
  })

  it('FunctionDefinition with two overrides', () => {
    var ast = parseNode("function foo() public override(Base1, Base2) {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": "foo",
      "parameters": [],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "public",
      "modifiers": [],
      "override": [{
        "type": "UserDefinedTypeName",
        "namePath": "Base1"
      }, {
        "type": "UserDefinedTypeName",
        "namePath": "Base2"
      }],
      "isConstructor": false,
      "isFallback": false,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": null,
    })
  })

  it("FunctionDefinition", function() {
    var ast = parseNode("function foo(uint a) pure {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": "foo",
      "parameters": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "default",
      "modifiers": [],
      "override": null,
      "isConstructor": false,
      "isFallback": false,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": "pure",
    })

     ast = parseNode("function foo() virtual public {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": "foo",
      "parameters": [],
      "returnParameters": null,
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "public",
      "modifiers": [],
      "override": null,
      "isConstructor": false,
      "isFallback": false,
      "isReceiveEther": false,
      "isVirtual": true,
      "stateMutability": null,
    })

    // Function Definition with return parameters
    ast = parseNode("function foo(uint a) pure returns (uint256) {}")
    assert.deepEqual(ast, {
      "type": "FunctionDefinition",
      "natspec": null,
      "name": "foo",
      "parameters": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "returnParameters": [
        {
          "isIndexed": false,
          "isStateVar": false,
          "name": null,
          "storageLocation": null,
          "type": "VariableDeclaration",
          "typeName": {
            "name": "uint256",
            "type": "ElementaryTypeName"
          }
        }
      ],
      "body": {
        "type": "Block",
        "statements": []
      },
      "visibility": "default",
      "modifiers": [],
      "override": null,
      "isConstructor": false,
      "isFallback": false,
      "isReceiveEther": false,
      "isVirtual": false,
      "stateMutability": "pure"
    })
  })

  it("ModifierInvocation", function() {
    var ast = parseNode("function foo(uint a) onlyOwner {}")
    assert.deepEqual(ast.modifiers[0], {
      "type": "ModifierInvocation",
      "name": "onlyOwner",
      "arguments": null
    })

    var ast = parseNode("function foo(uint a) onlyOwner() {}")
    assert.deepEqual(ast.modifiers[0], {
      "type": "ModifierInvocation",
      "name": "onlyOwner",
      "arguments": []
    })

    ast = parseNode("function foo(uint a) bar(true, 1) {}")
    assert.deepEqual(ast.modifiers[0], {
      "type": "ModifierInvocation",
      "name": "bar",
      "arguments": [
        {
          "type": "BooleanLiteral",
          "value": true
        },
        {
          "type": "NumberLiteral",
          "number": "1",
          "subdenomination": null
        },
      ]
    })
  })

  it("TypeNameExpression", function() {
    var stmt = parseStatement("uint(a);")
    assert.deepEqual(stmt.expression.expression, {
      "type": "TypeNameExpression",
      "typeName": {
        "type": "ElementaryTypeName",
        "name": "uint"
      }
    })
    stmt = parseStatement("A.B[];")
    assert.deepEqual(stmt.expression, {
      "type": "TypeNameExpression",
      "typeName": {
        "type": "ArrayTypeName",
        "baseTypeName": {
          "expression": {
            "name": "A",
            "type": "Identifier"
          },
          "memberName": "B",
          "type": "MemberAccess"
        },
        "length": null
      }
    })
  })

  it("TypeName", function() {
    var ast = parseNode("uint256[2] a;")
    assert.deepEqual(ast.variables[0].typeName, {
      "type": "ArrayTypeName",
      "baseTypeName": {
        "type": "ElementaryTypeName",
        "name": "uint256"
      },
      "length": {
        "type": "NumberLiteral",
        "number": "2",
        "subdenomination": null
      }
    })

    ast = parseNode("uint256[] a;")
    assert.deepEqual(ast.variables[0].typeName, {
      "type": "ArrayTypeName",
      "baseTypeName": {
        "type": "ElementaryTypeName",
        "name": "uint256"
      },
      "length": null
    })

    // typename as expression
    ast = parseExpression("A[]")
    assert.deepEqual(ast, {
      "type": "TypeNameExpression",
      "typeName": {
        "type": "ArrayTypeName",
        "baseTypeName": {
          "type": "UserDefinedTypeName",
          "namePath": "A"
        },
        "length": null
      }
    })

    ast = parseExpression("uint256[]")
    assert.deepEqual(ast, {
      "type": "TypeNameExpression",
      "typeName": {
        "type": "ArrayTypeName",
        "baseTypeName": {
          "type": "ElementaryTypeName",
          "name": "uint256"
        },
        "length": null
      }
    })
  })

  it("ElementaryTypeName", function() {
    var ast = parseNode("address payable a;")
    assert.deepEqual(ast.variables[0].typeName, {
      "type": "ElementaryTypeName",
      "name": "address",
      "stateMutability": "payable"
    })
  })

  it("FunctionTypeName", function() {
    var ast = parseNode("function (uint, uint) returns(bool) a;")
    assert.deepEqual(ast.variables[0].typeName, {
      "type": "FunctionTypeName",
      "parameterTypes": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": null,
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        },
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": null,
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "returnTypes": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "bool"
          },
          "name": null,
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "visibility": "default",
      "stateMutability": null
    })
  })

  it("ReturnStatement", function() {
    var ast = parseStatement("return;")
    assert.deepEqual(ast, {
      "type": "ReturnStatement",
      "expression": null
    })

    ast = parseStatement("return 2;")
    assert.deepEqual(ast, {
      "type": "ReturnStatement",
      "expression": {
        "type": "NumberLiteral",
        "number": "2",
        "subdenomination": null
      }
    })

    ast = parseStatement("return ();")
    assert.deepEqual(ast, {
      "type": "ReturnStatement",
      "expression": {
        "type": "TupleExpression",
        "isArray": false,
        "components": []
      }
    })
  })

  it("ThrowStatement", function() {
    var ast = parseStatement("throw;")
    assert.deepEqual(ast, {
      "type": "ThrowStatement",
    })
  })

  it("EmitStatement", function() {
    var ast = parseStatement("emit EventCalled(1);")
    assert.deepEqual(ast, {
      "type": "EmitStatement",
      "eventCall": {
        "type": "FunctionCall",
        "expression": {
          "type": "Identifier",
          "name": "EventCalled"
        },
        "arguments": [
          {
            "type": "NumberLiteral",
            "number": "1",
            "subdenomination": null
          }
        ],
        "names": []
      }
    })
  })

  it("StructDefinition", function() {
    var ast = parseNode("struct hello { uint a; }")
    assert.deepEqual(ast, {
      "type": "StructDefinition",
      "name": "hello",
      "natspec": null,
      "members": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ]
    })
  })

  it("VariableDeclaration", function() {
    // state variable
    var ast = parseNode("uint a;")
    assert.deepEqual(ast.variables[0], {
      "type": "VariableDeclaration",
      "typeName": {
        "type": "ElementaryTypeName",
        "name": "uint"
      },
      "name": "a",
      "expression": null,
      "visibility": "default",
      "isStateVar": true,
      "isDeclaredConst": false,
      "isIndexed": false
    })
  })

  it("WhileStatement", function() {
    var stmt = parseStatement("while (true) {}")
    assert.deepEqual(stmt, {
      "type": "WhileStatement",
      "condition": {
        "type": "BooleanLiteral",
        "value": true
      },
      "body": {
        "type": "Block",
        "statements": []
      }
    })

    stmt = parseStatement("do {} while (true);")
    assert.deepEqual(stmt, {
      "type": "DoWhileStatement",
      "condition": {
        "type": "BooleanLiteral",
        "value": true
      },
      "body": {
        "type": "Block",
        "statements": []
      }
    })
  })

  it("IfStatement", function() {
    var stmt = parseStatement("if (true) {}")
    assert.deepEqual(stmt, {
      "type": "IfStatement",
      "condition": {
        "type": "BooleanLiteral",
        "value": true
      },
      "trueBody": {
        "type": "Block",
        "statements": []
      },
      "falseBody": null
    })

    // else
    stmt = parseStatement("if (true) {} else {}")
    assert.deepEqual(stmt, {
      "type": "IfStatement",
      "condition": {
        "type": "BooleanLiteral",
        "value": true
      },
      "trueBody": {
        "type": "Block",
        "statements": []
      },
      "falseBody": {
        "type": "Block",
        "statements": []
      },
    })
  })

  it("TryStatement", function() {
    // try with one catch clause
    var stmt = parseStatement(
      "try f(1, 2) returns (uint a) {} catch (bytes memory a) {}"
    )
    assert.deepEqual(stmt, {
      "type": "TryStatement",
      "expression": {
        "type": "FunctionCall",
        "expression": {
          "type": "Identifier",
          "name": "f"
        },
        "arguments": [
          {
            "type": "NumberLiteral",
            "number": "1",
            "subdenomination": null
          },
          {
            "type": "NumberLiteral",
            "number": "2",
            "subdenomination": null
          }
        ],
        "names": []
      },
      "returnParameters": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "body": {
        "type": "Block",
        "statements": []
      },
      "catchClauses": [
        {
          "body": {
            "statements": [],
            "type": "Block"
          },
          "isReasonStringType": false,
          "parameters": [
            {
              "isIndexed": false,
              "isStateVar": false,
              "name": "a",
              "storageLocation": "memory",
              "type": "VariableDeclaration",
              "typeName": {
                "name": "bytes",
                "type": "ElementaryTypeName"
              }
            }
          ],
          "type": "CatchClause"
        }
      ]
    })

    // try with two catch clauses
    var stmt = parseStatement(
      "try f(1, 2) returns (uint a) {} catch Error(string memory b) {} catch (bytes memory c) {}"
    )
    assert.deepEqual(stmt, {
      "type": "TryStatement",
      "expression": {
        "type": "FunctionCall",
        "expression": {
          "type": "Identifier",
          "name": "f"
        },
        "arguments": [
          {
            "type": "NumberLiteral",
            "number": "1",
            "subdenomination": null
          },
          {
            "type": "NumberLiteral",
            "number": "2",
            "subdenomination": null
          }
        ],
        "names": []
      },
      "returnParameters": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "body": {
        "type": "Block",
        "statements": []
      },
      "catchClauses": [
        {
          "body": {
            "statements": [],
            "type": "Block"
          },
          "isReasonStringType": true,
          "parameters": [
            {
              "isIndexed": false,
              "isStateVar": false,
              "name": "b",
              "storageLocation": "memory",
              "type": "VariableDeclaration",
              "typeName": {
                "name": "string",
                "type": "ElementaryTypeName"
              }
            }
          ],
          "type": "CatchClause"
        },
        {
          "body": {
            "statements": [],
            "type": "Block"
          },
          "isReasonStringType": false,
          "parameters": [
            {
              "isIndexed": false,
              "isStateVar": false,
              "name": "c",
              "storageLocation": "memory",
              "type": "VariableDeclaration",
              "typeName": {
                "name": "bytes",
                "type": "ElementaryTypeName"
              }
            }
          ],
          "type": "CatchClause"
        }
      ]
    })
  })

  it("UserDefinedTypeName", function() {
    var ast = parseStatement("Foo.Bar a;")
    assert.deepEqual(ast.variables[0].typeName, {
      "type": "UserDefinedTypeName",
      "namePath": "Foo.Bar"
    })
  })

  it("ExpressionStatement", function() {
    var stmt = parseStatement("true;")
    assert.deepEqual(stmt, {
      "type": "ExpressionStatement",
      "expression": {
        "type": "BooleanLiteral",
        "value": true
      }
    })
  })

  it("NumberLiteral", function() {
    var expr = parseExpression("2 ether")
    assert.deepEqual(expr, {
      "type": "NumberLiteral",
      "number": "2",
      "subdenomination": "ether"
    })

    expr = parseExpression("2.3e5")
    assert.deepEqual(expr, {
      "type": "NumberLiteral",
      "number": "2.3e5",
      "subdenomination": null
    })

    expr = parseExpression(".1")
    assert.deepEqual(expr, {
      "type": "NumberLiteral",
      "number": ".1",
      "subdenomination": null
    })

    expr = parseExpression("1_000_000")
    assert.deepEqual(expr, {
      "type": "NumberLiteral",
      "number": "1_000_000",
      "subdenomination": null
    })
  })

  it("StringLiteral with double quotes", function() {
    var expr = parseExpression("\"Hello\"")
    assert.deepEqual(expr, {
      "type": "StringLiteral",
      "value": "Hello",
    })
  })

  it("StringLiteral with single quotes", function() {
    var expr = parseExpression("'Hello'")
    assert.deepEqual(expr, {
      "type": "StringLiteral",
      "value": "Hello",
    })
  })

  it("StringLiteral with escaped double quotes", function() {
    var expr = parseExpression("\"Hello \\\"goodbye\\\"\"")
    assert.deepEqual(expr, {
      "type": "StringLiteral",
      "value": "Hello \"goodbye\"",
    })
  })

  it("StringLiteral with escaped single quotes", function() {
    var expr = parseExpression("'Hello \\\'goodbye\\\''")
    assert.deepEqual(expr, {
      "type": "StringLiteral",
      "value": "Hello 'goodbye'",
    })
  })

  it("Multiline StringLiteral with newline", function() {
    var expr = parseExpression("\"Hello \"\n\"World\"")
    assert.deepEqual(expr, {
      "type": "StringLiteral",
      "value": "Hello World",
    })
  })

  it("Multiline StringLiteral with space", function() {
    var expr = parseExpression("\"Hello \" \"World\"")
    assert.deepEqual(expr, {
      "type": "StringLiteral",
      "value": "Hello World",
    })
  })

  it("Multiline StringLiteral with no space", function() {
    var expr = parseExpression("\"Hello \"\"World\"")
    assert.deepEqual(expr, {
      "type": "StringLiteral",
      "value": "Hello World",
    })
  })

  it("HexLiteral", function() {
    var expr = parseExpression("hex\"fafafa\"")
    assert.deepEqual(expr, {
      type: "HexLiteral",
      value: "hex\"fafafa\""
    })
  })

  it("Empty HexLiteral", function() {
    var expr = parseExpression("hex\"\"")
    assert.deepEqual(expr, {
      type: "HexLiteral",
      value: "hex\"\""
    })
  })

  it("BooleanLiteral", function() {
    var expr = parseExpression("false")
    assert.deepEqual(expr, {
      "type": "BooleanLiteral",
      "value": false,
    })
  })

  it("Mapping", function() {
    var ast = parseNode("mapping(uint => address) a;")
    assert.deepEqual(ast.variables[0].typeName, {
      "type": "Mapping",
      "keyType": {
        "type": "ElementaryTypeName",
        "name": "uint"
      },
      "valueType": {
        "type": "ElementaryTypeName",
        "name": "address"
      }
    })
  })

  it("ModifierDefinition", function() {
    var ast = parseNode("modifier onlyOwner {}")
    assert.deepEqual(ast, {
      "type": "ModifierDefinition",
      "name": "onlyOwner",
      "natspec": null,
      "parameters": null,
      "body": {
        "type": "Block",
        "statements": []
      }
    })
    var ast = parseNode("modifier onlyOwner() {}")
    assert.deepEqual(ast, {
      "type": "ModifierDefinition",
      "name": "onlyOwner",
      "natspec": null,
      "parameters": [],
      "body": {
        "type": "Block",
        "statements": []
      }
    })
  })

  it("Expression", function() {
    // new expression
    var expr = parseExpression("new MyContract")
    assert.deepEqual(expr, {
      "type": "NewExpression",
      "typeName": {
        "type": "UserDefinedTypeName",
        "namePath": "MyContract"
      }
    })

    // prefix operation
    var expr = parseExpression("!true")
    assert.deepEqual(expr, {
      "type": "UnaryOperation",
      "operator": "!",
      "subExpression": {
        "type": "BooleanLiteral",
        "value": true
      },
      "isPrefix": true
    })

    // prefix operation
    var expr = parseExpression("i++")
    assert.deepEqual(expr, {
      "type": "UnaryOperation",
      "operator": "++",
      "subExpression": {
        "type": "Identifier",
        "name": "i"
      },
      "isPrefix": false
    })
  })

  it("FunctionCall", function() {
    var expr = parseExpression("f(1, 2)")
    assert.deepEqual(expr, {
      "type": "FunctionCall",
      "expression": {
        "type": "Identifier",
        "name": "f"
      },
      "arguments": [
        {
          "type": "NumberLiteral",
          "number": "1",
          "subdenomination": null
        },
        {
          "type": "NumberLiteral",
          "number": "2",
          "subdenomination": null
        }
      ],
      "names": []
    })
    var expr = parseExpression("type(MyContract)")
    assert.deepEqual(expr, {
      "type": "FunctionCall",
      "expression": {
        "type": "Identifier",
        "name": "type"
      },
      "arguments": [
        {
          "type": "Identifier",
          "name": "MyContract",
        }
      ],
      "names": []
    })
  })

  it("StateVariableDeclaration", function() {
    var ast = parseNode("uint a;")
    assert.deepEqual(ast, {
      "type": "StateVariableDeclaration",
      "variables": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "expression": null,
          "visibility": "default",
          "isStateVar": true,
          "isDeclaredConst": false,
          "isIndexed": false
        }
      ],
      "initialValue": null,
      "natspec": null
    })
  })

  it("ForStatement", function() {
    var stmt = parseStatement("for (i = 0; i < 10; i++) {}")
    assert.deepEqual(stmt, {
      "type": "ForStatement",
      "initExpression": {
        "type": "ExpressionStatement",
        "expression": {
          "type": "BinaryOperation",
          "operator": "=",
          "left": {
            "type": "Identifier",
            "name": "i"
          },
          "right": {
            "type": "NumberLiteral",
            "number": "0",
            "subdenomination": null
          }
        }
      },
      "conditionExpression": {
        "type": "BinaryOperation",
        "operator": "<",
        "left": {
          "type": "Identifier",
          "name": "i"
        },
        "right": {
          "type": "NumberLiteral",
          "number": "10",
          "subdenomination": null
        }
      },
      "loopExpression": {
        "type": "ExpressionStatement",
        "expression": {
          "type": "UnaryOperation",
          "operator": "++",
          "subExpression": {
            "type": "Identifier",
            "name": "i"
          },
          "isPrefix": false
        }
      },
      "body": {
        "type": "Block",
        "statements": []
      }
    })
    stmt = parseStatement("for (;; i++) {}")
    assert.deepEqual(stmt, {
      "type": "ForStatement",
      "initExpression": null,
      "conditionExpression": null,
      "loopExpression": {
        "type": "ExpressionStatement",
        "expression": {
          "type": "UnaryOperation",
          "operator": "++",
          "subExpression": {
            "type": "Identifier",
            "name": "i"
          },
          "isPrefix": false
        }
      },
      "body": {
        "type": "Block",
        "statements": []
      }
    })
  })

  it("IdentifierList", function() {
    var expr = parseExpression("(a,) = (1,2)")
    assert.deepEqual(expr.left, {
      "components": [
        {
          "name": "a",
          "type": "Identifier",
        },
        null,
      ],
      "isArray": false,
      "type": "TupleExpression",
    })
    expr = parseExpression("(a) = (1,)")
    assert.deepEqual(expr.left, {
      "components": [
        {
          "name": "a",
          "type": "Identifier",
        },
      ],
      "isArray": false,
      "type": "TupleExpression",
    })
    expr = parseExpression("(a,,b,) = (1,2,1)")
    assert.deepEqual(expr.left, {
      "components": [
        {
          "name": "a",
          "type": "Identifier",
        },
        null,
        {
          "name": "b",
          "type": "Identifier",
        },
        null,
      ],
      "isArray": false,
      "type": "TupleExpression",
    })
  })

  it("Identifier", function() {
    var expr = parseExpression("a")
    assert.deepEqual(expr, {
      "type": "Identifier",
      "name": "a",
    })
    expr = parseExpression("calldata")
    assert.deepEqual(expr, {
      "type": "Identifier",
      "name": "calldata",
    })
  })

  it("TupleExpression", function() {
    // tuple
    var ast = parseExpression("(,a,, b,,)")
    assert.deepEqual(ast, {
      "type": "TupleExpression",
      "components": [
        null,
        {
          "type": "Identifier",
          "name": "a"
        },
        null,
        {
          "type": "Identifier",
          "name": "b"
        },
        null,
        null
      ],
      "isArray": false
    })

    // array
    ast = parseExpression("[a, b]")
    assert.deepEqual(ast, {
      "type": "TupleExpression",
      "components": [
        {
          "type": "Identifier",
          "name": "a"
        },
        {
          "type": "Identifier",
          "name": "b"
        }
      ],
      "isArray": true
    })
  })

  it("VariableDeclarationStatement", function() {
    var stmt = parseStatement("uint a;")
    assert.deepEqual(stmt, {
      "type": "VariableDeclarationStatement",
      "variables": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "a",
          "storageLocation": null,
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "initialValue": null
    })

    stmt = parseStatement("var (a,,b) = 0;")
    assert.deepEqual(stmt, {
      "type": "VariableDeclarationStatement",
      "initialValue": {
        "number": "0",
        "subdenomination": null,
        "type": "NumberLiteral"
      },
      "variables": [
        {
          "isIndexed": false,
          "isStateVar": false,
          "name": "a",
          "storageLocation": null,
          "type": "VariableDeclaration",
          "typeName": null
        },
        null,
        {
          "isIndexed": false,
          "isStateVar": false,
          "name": "b",
          "storageLocation": null,
          "type": "VariableDeclaration",
          "typeName": null
        }
      ]
    })

    stmt = parseStatement("(uint a,, uint b) = 0;")
    assert.deepEqual(stmt, {
      "type": "VariableDeclarationStatement",
      "initialValue": {
        "number": "0",
        "subdenomination": null,
        "type": "NumberLiteral"
      },
      "variables": [
        {
          "isIndexed": false,
          "isStateVar": false,
          "name": "a",
          "storageLocation": null,
          "type": "VariableDeclaration",
          "typeName": {
            "name": "uint",
            "type": "ElementaryTypeName"
          }
        },
        null,
        {
          "isIndexed": false,
          "isStateVar": false,
          "name": "b",
          "storageLocation": null,
          "type": "VariableDeclaration",
          "typeName": {
            "name": "uint",
            "type": "ElementaryTypeName"
          }
        }
      ]
    })
  })

  it("ImportDirective", function() {
    var ast = parser.parse("import \"./abc.sol\";")
    assert.deepEqual(ast.children[0], {
      "type": "ImportDirective",
      "path": "./abc.sol",
      "unitAlias": null,
      "symbolAliases": null
    })

    ast = parser.parse("import \"./abc.sol\" as x;")
    assert.deepEqual(ast.children[0], {
      "type": "ImportDirective",
      "path": "./abc.sol",
      "unitAlias": "x",
      "symbolAliases": null
    })

    ast = parser.parse("import * as x from \"./abc.sol\";")
    assert.deepEqual(ast.children[0], {
      "type": "ImportDirective",
      "path": "./abc.sol",
      "unitAlias": "x",
      "symbolAliases": null
    })

    ast = parser.parse("import { a as b, c as d, f } from \"./abc.sol\";")
    assert.deepEqual(ast.children[0], {
      "type": "ImportDirective",
      "path": "./abc.sol",
      "unitAlias": null,
      "symbolAliases": [
        ["a", "b"],
        ["c", "d"],
        ["f", null],
      ]
    })
  })

  it("EventDefinition", function() {
    var ast = parseNode("event Foo(address indexed a, uint b);")
    assert.deepEqual(ast, {
      "type": "EventDefinition",
      "name": "Foo",
      "natspec": null,
      "parameters": [
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "address"
          },
          "name": "a",
          "isStateVar": false,
          "isIndexed": true
        },
        {
          "type": "VariableDeclaration",
          "typeName": {
            "type": "ElementaryTypeName",
            "name": "uint"
          },
          "name": "b",
          "isStateVar": false,
          "isIndexed": false
        }
      ],
      "isAnonymous": false
    })
  })

  it("InlineAssemblyStatement", function() {
    var ast = parseStatement("assembly {}")
    assert.deepEqual(ast, {
      "type": "InlineAssemblyStatement",
      "language": null,
      "body": {
        "type": "AssemblyBlock",
        "operations": []
      }
    })

    ast = parseStatement("assembly \"evmasm\" {}")
    assert.deepEqual(ast, {
      "type": "InlineAssemblyStatement",
      "language": "evmasm",
      "body": {
        "type": "AssemblyBlock",
        "operations": []
      }
    })
  })

  it("AssemblyCall", function() {
    var ast = parseAssembly("mload(0x04)")
    assert.deepEqual(ast, {
      "type": "AssemblyCall",
      "functionName": "mload",
      "arguments": [
        {
          "type": "HexNumber",
          "value": "0x04"
        }
      ]
    })
  })

  it("AssemblyLiteral", function() {
    var ast = parseAssembly("0x04")
    assert.deepEqual(ast, {
      "type": "HexNumber",
      "value": "0x04"
    })

    ast = parseAssembly("\"hello\"")
    assert.deepEqual(ast, {
      "type": "StringLiteral",
      "value": "hello"
    })
  })

  it("AssemblySwitch / AssemblyCase", function() {
    var ast = parseAssembly("switch x case 0 { y := mul(x, 2) } default { y := 0 }")
    assert.deepEqual(ast, {
      "type": "AssemblySwitch",
      "expression": {
        "type": "AssemblyCall",
        "functionName": "x",
        "arguments": []
      },
      "cases": [
        {
          "type": "AssemblyCase",
          "block": {
            "type": "AssemblyBlock",
            "operations": [
              {
                "type": "AssemblyAssignment",
                "names": [
                  {
                    "type": "Identifier",
                    "name": "y"
                  }
                ],
                "expression": {
                  "type": "AssemblyCall",
                  "functionName": "mul",
                  "arguments": [
                    {
                      "type": "AssemblyCall",
                      "functionName": "x",
                      "arguments": []
                    },
                    {
                      "type": "DecimalNumber",
                      "value": "2"
                    }
                  ]
                }
              }
            ]
          },
          "value": {
            "type": "DecimalNumber",
            "value": "0"
          }
        },
        {
          "type": "AssemblyCase",
          "block": {
            "type": "AssemblyBlock",
            "operations": [
              {
                "type": "AssemblyAssignment",
                "names": [
                  {
                    "type": "Identifier",
                    "name": "y"
                  }
                ],
                "expression": {
                  "type": "DecimalNumber",
                  "value": "0"
                }
              }
            ]
          },
          "default": true
        }
      ]
    })
  })

  it("AssemblyLocalDefinition", function() {
    var ast = parseAssembly("let x := 0x04")
    assert.deepEqual(ast, {
      "type": "AssemblyLocalDefinition",
      "names": [
        {
          "type": "Identifier",
          "name": "x"
        }
      ],
      "expression": {
        "type": "HexNumber",
        "value": "0x04"
      }
    })

  })

  it("AssemblyFunctionDefinition", function() {
    var ast = parseAssembly("function power(base, exponent) -> result {}")
    assert.deepEqual(ast, {
      "type": "AssemblyFunctionDefinition",
      "name": "power",
      "arguments": [
        {
          "type": "Identifier",
          "name": "base"
        },
        {
          "type": "Identifier",
          "name": "exponent"
        }
      ],
      "returnArguments": [
        {
          "type": "Identifier",
          "name": "result"
        }
      ],
      "body": {
        "type": "AssemblyBlock",
        "operations": []
      }
    })
    var ast = parseAssembly("function foo() -> result {}")
    assert.deepEqual(ast, {
      "type": "AssemblyFunctionDefinition",
      "name": "foo",
      "arguments": [],
      "returnArguments": [
        {
          "type": "Identifier",
          "name": "result"
        }
      ],
      "body": {
        "type": "AssemblyBlock",
        "operations": []
      }
    })
    var ast = parseAssembly("function foo(x) {}")
    assert.deepEqual(ast, {
      "type": "AssemblyFunctionDefinition",
      "name": "foo",
      "arguments": [
        {
          "type": "Identifier",
          "name": "x"
        },
      ],
      "returnArguments": [],
      "body": {
        "type": "AssemblyBlock",
        "operations": []
      }
    })
  })

  it("AssemblyAssignment", function() {
    var ast = parseAssembly("a := 10")
    assert.deepEqual(ast, {
      "type": "AssemblyAssignment",
      "names": [
        {
          "type": "Identifier",
          "name": "a"
        }
      ],
      "expression": {
        "type": "DecimalNumber",
        "value": "10"
      }
    })
  })

  it("LabelDefinition", function() {
    var ast = parseAssembly("loop:")
    assert.deepEqual(ast, {
      "type": "LabelDefinition",
      "name": "loop"
    })
  })

  it("AssemblyStackAssignment", function() {
    var ast = parseAssembly("=: a")
    assert.deepEqual(ast, {
      "type": "AssemblyStackAssignment",
      "name": "a"
    })
  })

  it("AssemblyFor", function() {
    var ast = parseAssembly("for { let i := 0  } lt(i, x) { i := add(i, 1)  } { y := mul(2, y) }")
    assert.deepEqual(ast, {
      "type": "AssemblyFor",
      "pre": {
        "type": "AssemblyBlock",
        "operations": [
          {
            "type": "AssemblyLocalDefinition",
            "names": [
              {
                "type": "Identifier",
                "name": "i"
              }
            ],
            "expression": {
              "type": "DecimalNumber",
              "value": "0"
            }
          }
        ]
      },
      "condition": {
        "type": "AssemblyCall",
        "functionName": "lt",
        "arguments": [
          {
            "type": "AssemblyCall",
            "functionName": "i",
            "arguments": []
          },
          {
            "type": "AssemblyCall",
            "functionName": "x",
            "arguments": []
          }
        ]
      },
      "post": {
        "type": "AssemblyBlock",
        "operations": [
          {
            "type": "AssemblyAssignment",
            "names": [
              {
                "type": "Identifier",
                "name": "i"
              }
            ],
            "expression": {
              "type": "AssemblyCall",
              "functionName": "add",
              "arguments": [
                {
                  "type": "AssemblyCall",
                  "functionName": "i",
                  "arguments": []
                },
                {
                  "type": "DecimalNumber",
                  "value": "1"
                }
              ]
            }
          }
        ]
      },
      "body": {
        "type": "AssemblyBlock",
        "operations": [
          {
            "type": "AssemblyAssignment",
            "names": [
              {
                "type": "Identifier",
                "name": "y"
              }
            ],
            "expression": {
              "type": "AssemblyCall",
              "functionName": "mul",
              "arguments": [
                {
                  "type": "DecimalNumber",
                  "value": "2"
                },
                {
                  "type": "AssemblyCall",
                  "functionName": "y",
                  "arguments": []
                }
              ]
            }
          }
        ]
      }
    })
  })

  it("AssemblyIf", function() {
    var ast = parseAssembly("if lt(i, x) { revert(0, 0) }")
    assert.deepEqual(ast, {
      "body": {
        "operations": [
          {
            "arguments": [
              {
                "type": "DecimalNumber",
                "value": "0"
              },
              {
                "type": "DecimalNumber",
                "value": "0"
              }
            ],
            "functionName": "revert",
            "type": "AssemblyCall"
          }
        ],
        "type": "AssemblyBlock"
      },
      "condition": {
        "arguments": [
          {
            "arguments": [],
            "functionName": "i",
            "type": "AssemblyCall"
          },
          {
            "arguments": [],
            "functionName": "x",
            "type": "AssemblyCall"
          }
        ],
        "functionName": "lt",
        "type": "AssemblyCall"
      },
      "type": "AssemblyIf"
    })
  })

  it("NatSpec multi line", function () {
    const ast = parser.parse(
`/**
  * @dev This is the Sum contract.
  * @title Sum Contract
  * @author username
  */
contract Sum { }`
    );
    assert.deepEqual(ast.children[0], {
      type: "ContractDefinition",
      natspec: {
        dev: "This is the Sum contract.",
        title: "Sum Contract",
        author: "username",
      },
      name: "Sum",
      baseContracts: [],
      subNodes: [],
      kind: "contract",
    })
  })

  it("NatSpec single line", function () {
    const ast = parser.parse(
`/// @dev This is the Sum contract.
/// @title Sum Contract
/// @author username
contract Sum { }`
    );
    assert.deepEqual(ast.children[0], {
      type: "ContractDefinition",
      natspec: {
        dev: "This is the Sum contract.",
        title: "Sum Contract",
        author: "username",
      },
      name: "Sum",
      baseContracts: [],
      subNodes: [],
      kind: "contract",
    })
  })

  it("NatSpec multi line event", function () {
    const ast = parseNode(
`/**
  * @dev This method says hello
  * @param user the user address
  */
  event sayHello(address user);`
    );
    assert.deepEqual(ast.natspec, {
      dev: "This method says hello",
      params: {
        user: "the user address"
      },
    })
  })

  it("NatSpec multi line function", function () {
    const ast = parseNode(
`/**
  * @dev This method transfer fund to other user
  * @param from the address extract funds
  * @param to the user address to give funds
  * @param amount the amount to transfer
  */
 function transfer(address from, address to, uint256 amount) public {}`);

    assert.deepEqual(ast.natspec, {
      dev: "This method transfer fund to other user",
      params: {
        from: "the address extract funds",
        to: "the user address to give funds",
        amount: "the amount to transfer",
      },
    })
  })

  it("NatSpec multi line multiple functions in contract", function () {
    const ast = parser.parse(
`/**
  * @dev The ERC20 contract
  */
 contract ERC20 {
    /**
     * @dev This method transfer fund to other user
     * @param from the address extract funds
     * @param to the user address to give funds
     * @param amount the amount to transfer
     */
    function transfer(address from, address to, uint256 amount) public {}
    /**
     * @dev This method gets the approved amount
     * @param user the user address to verify
     * @return the approved amount
     */
    function approved(address user) public view returns(uint256) {}
 }`);
    const methods = ast.children[0].subNodes;
    assert.deepEqual(methods[0].natspec, {
      dev: 'This method transfer fund to other user',
      params: {
        from: 'the address extract funds',
        to: 'the user address to give funds',
        amount: 'the amount to transfer',
      },
    });
    assert.deepEqual(methods[1].natspec, {
      dev: 'This method gets the approved amount',
      params: {
        user: 'the user address to verify',
      },
      return: 'the approved amount',
    });
  })

  it("NatSpec multi line modifier", function() {
    var ast = parseNode(`/**
    * @dev The onlyOwner modifier
    * @param user the user
    */
   modifier onlyOwner(address user) {}`)
    assert.deepEqual(ast.natspec, {
      dev: 'The onlyOwner modifier',
      params: {
        user: 'the user',
      },
    })
  })

  it("NatSpec multi line struct", function() {
    var ast = parseNode(`/**
    * @dev The hello struct
    * @param a the variable a
    */
   struct hello { uint a; }`)
    assert.deepEqual(ast.natspec, {
      dev: 'The hello struct',
      params: {
        a: 'the variable a',
      },
    })
  })

  it("NatSpec multi line constructor", function() {
    var ast = parseNode(`/**
    * @dev The hello constructor
    * @param a the variable a
    */
   constructor(uint256 a) public { }`)
    assert.deepEqual(ast.natspec, {
      dev: 'The hello constructor',
      params: {
        a: 'the variable a',
      },
    })
  })

  it("NatSpec multi line single natspec constructor", function() {
    var ast = parseNode(`/**
    * @dev The hello constructor
    *
    * Guess what? Will keep multiline
    * @param a the variable a
    * Same as this one here tho!
    */
   constructor(uint256 a) public { }`)
    assert.deepEqual(ast.natspec, {
      dev: 'The hello constructor\n\nGuess what? Will keep multiline',
      params: {
        a: 'the variable a\nSame as this one here tho!',
      },
    })
  })

  it("NatSpec single line single natspec variable", function() {
    var ast = parseNode(`
    /// @dev This is a comment for a variable
    uint256 internal myvar;`)
    assert.deepEqual(ast.natspec, {
      dev: 'This is a comment for a variable',
    })
  })

   it("NatSpec multi line single natspec variable", function() {
    var ast = parseNode(`/**
    * @dev This is a comment for a variable
    */
   mapping (bytes32 => uint256) internal myvar;`)
    assert.deepEqual(ast.natspec, {
      dev: 'This is a comment for a variable',
    })
  })
})
