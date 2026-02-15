import { parse } from '@typescript-eslint/parser';
import { BaseParser } from './base.parser';
import { IClassInfo, IEnumInfo, IExportInfo, IFileAnalysis, IFunctionInfo, IImportInfo, IInterfaceInfo, IMethodInfo, IPropertyInfo, IDecoratorInfo, ITypeAliasInfo } from '../../models/file-analysis.model';

export class TypeScriptParser extends BaseParser {
  async parse(filePath: string, content: string): Promise<Partial<IFileAnalysis>> {
    try {
      // Verifica che il contenuto non sia vuoto
      if (!content || content.trim().length === 0) {
        console.warn(`⚠️  File vuoto: ${filePath}`);
        return {
          functions: [],
          classes: [],
          imports: [],
          exports: []
        };
      }

      const ast = parse(content, {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        // Aggiungi opzioni per gestire file Angular
        loc: true,
        range: true,
        comment: true,
        tokens: false,
        warnOnUnsupportedTypeScriptVersion: false
      });

      const functions = this.extractFunctions(ast);
      const classes = this.extractClasses(ast);
      const imports = this.extractImports(ast);
      const exports = this.extractExports(ast);
      const enums = this.extractEnums(ast);
      const interfaces = this.extractInterfaces(ast);
      const types = this.extractTypes(ast);

      return {
        ast,
        functions,
        classes,
        imports,
        exports,
        enums,
        interfaces,
        types
      };
    } catch (error: any) {
      console.error(`❌ Errore parsing ${filePath}:`);
      console.error(`   Messaggio: ${error.message}`);
      
      // Prova parsing alternativo per file problematici
      try {
        console.log(`   🔄 Tentativo parsing alternativo...`);
        
        const ast = parse(content, {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: {
            jsx: true,
            globalReturn: true
          },
          errorOnUnknownASTType: false
        });

        const functions = this.extractFunctions(ast);
        const classes = this.extractClasses(ast);
        const imports = this.extractImports(ast);
        const exports = this.extractExports(ast);

        console.log(`   ✅ Parsing alternativo riuscito`);
        
        return {
          ast,
          functions,
          classes,
          imports,
          exports
        };
      } catch (fallbackError) {
        console.error(`   ❌ Anche parsing alternativo fallito`);
        return {
          functions: [],
          classes: [],
          imports: [],
          exports: []
        };
      }
    }
  }

  private extractFunctions(ast: any): IFunctionInfo[] {
    const functions: IFunctionInfo[] = [];
    const visited = new Set<any>();

    const traverse = (node: any) => {
      if (!node || visited.has(node)) return;
      visited.add(node);

      if (node.type === 'FunctionDeclaration' || 
          node.type === 'ArrowFunctionExpression' ||
          node.type === 'FunctionExpression') {
        
        const name = node.id?.name || 'anonymous';
        const params = node.params?.map((p: any) => p.name || this.getParamName(p)) || [];
        const isAsync = node.async || false;
        const isExported = this.isNodeExported(node);
        const description = this.getJSDocComment(node, ast);
        const decorators = this.extractDecorators(node);
        const complexity = this.calculateComplexity(node);

        functions.push({
          name,
          line: node.loc?.start?.line || 0,
          params,
          isAsync,
          isExported,
          description,
          decorators,
          complexity
        });
      }

      if (node.type === 'VariableDeclarator' && 
          (node.init?.type === 'ArrowFunctionExpression' || 
           node.init?.type === 'FunctionExpression')) {
        
        const name = node.id?.name || 'anonymous';
        const params = node.init.params?.map((p: any) => p.name || this.getParamName(p)) || [];
        const isAsync = node.init.async || false;
        const isExported = this.isNodeExported(node.parent);
        const description = this.getJSDocComment(node.parent, ast);
        const decorators = this.extractDecorators(node.parent);
        const complexity = this.calculateComplexity(node.init);

        functions.push({
          name,
          line: node.loc?.start?.line || 0,
          params,
          isAsync,
          isExported,
          description,
          decorators,
          complexity
        });
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => traverse(child));
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return functions;
  }

  private extractClasses(ast: any): IClassInfo[] {
    const classes: IClassInfo[] = [];

    const traverse = (node: any) => {
      if (!node) return;

      if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        const name = node.id?.name || 'AnonymousClass';
        const methods: IMethodInfo[] = [];
        const properties: IPropertyInfo[] = [];

        node.body?.body?.forEach((member: any) => {
          if (member.type === 'MethodDefinition') {
            methods.push({
              name: member.key?.name || 'unknown',
              line: member.loc?.start?.line || 0,
              params: member.value?.params?.map((p: any) => p.name || this.getParamName(p)) || [],
              isAsync: member.value?.async || false,
              visibility: this.getVisibility(member),
              description: this.getJSDocComment(member, ast),
              decorators: this.extractDecorators(member),
              complexity: this.calculateComplexity(member.value)
            });
          } else if (member.type === 'PropertyDefinition') {
            properties.push({
              name: member.key?.name || 'unknown',
              line: member.loc?.start?.line || 0,
              visibility: this.getVisibility(member),
              description: this.getJSDocComment(member, ast),
              decorators: this.extractDecorators(member)
            });
          }
        });

        classes.push({
          name,
          line: node.loc?.start?.line || 0,
          methods,
          properties,
          isExported: this.isNodeExported(node),
          extends: node.superClass?.name,
          implements: node.implements?.map((i: any) => i.expression?.name || 'unknown'),
          description: this.getJSDocComment(node, ast),
          decorators: this.extractDecorators(node)
        });
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => traverse(child));
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return classes;
  }

  private extractImports(ast: any): IImportInfo[] {
    const imports: IImportInfo[] = [];

    const traverse = (node: any) => {
      if (!node) return;

      if (node.type === 'ImportDeclaration') {
        const source = node.source?.value || '';
        const importSpecifiers = node.specifiers?.map((spec: any) => {
          if (spec.type === 'ImportDefaultSpecifier') {
            return spec.local?.name || '';
          }
          return spec.imported?.name || spec.local?.name || '';
        }) || [];

        const isDefault = node.specifiers?.some((spec: any) => 
          spec.type === 'ImportDefaultSpecifier'
        ) || false;

        imports.push({
          source,
          imports: importSpecifiers,
          isDefault
        });
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => traverse(child));
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return imports;
  }

  private extractExports(ast: any): IExportInfo[] {
    const exports: IExportInfo[] = [];

    const traverse = (node: any) => {
      if (!node) return;

      if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration') {
        if (node.declaration) {
          const decl = node.declaration;
          
          if (decl.type === 'FunctionDeclaration') {
            exports.push({
              name: decl.id?.name || 'default',
              type: 'function'
            });
          } else if (decl.type === 'ClassDeclaration') {
            exports.push({
              name: decl.id?.name || 'default',
              type: 'class'
            });
          } else if (decl.type === 'VariableDeclaration') {
            decl.declarations?.forEach((declarator: any) => {
              exports.push({
                name: declarator.id?.name || 'unknown',
                type: 'variable'
              });
            });
          } else if (decl.type === 'TSTypeAliasDeclaration' || decl.type === 'TSInterfaceDeclaration') {
            exports.push({
              name: decl.id?.name || 'unknown',
              type: 'type'
            });
          }
        }

        if (node.specifiers) {
          node.specifiers.forEach((spec: any) => {
            exports.push({
              name: spec.exported?.name || 'unknown',
              type: 'variable'
            });
          });
        }
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => traverse(child));
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return exports;
  }

  private getParamName(param: any): string {
    if (param.type === 'Identifier') {
      return param.name;
    } else if (param.type === 'RestElement') {
      return `...${param.argument?.name || 'rest'}`;
    } else if (param.type === 'AssignmentPattern') {
      return this.getParamName(param.left);
    } else if (param.type === 'ObjectPattern') {
      return '{...}';
    } else if (param.type === 'ArrayPattern') {
      return '[...]';
    }
    return 'unknown';
  }

  private getVisibility(member: any): 'public' | 'private' | 'protected' {
    if (member.accessibility) {
      return member.accessibility;
    }
    if (member.key?.name?.startsWith('_')) {
      return 'private';
    }
    return 'public';
  }

  private extractEnums(ast: any): IEnumInfo[] {
    const enums:IEnumInfo[] = [];

    const traverse = (node: any) => {
      if (!node) return;

      if (node.type === 'TSEnumDeclaration') {
        const name = node.id?.name || 'AnonymousEnum';
        const members = node.members?.map((m: any) => m.id?.name || 'unknown') || [];
        
        enums.push({
          name,
          line: node.loc?.start?.line || 0,
          members,
          isExported: this.isNodeExported(node)
        });
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => traverse(child));
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return enums;
  }

  private extractInterfaces(ast: any): IInterfaceInfo[] {
    const interfaces:IInterfaceInfo[] = [];

    const traverse = (node: any) => {
      if (!node) return;

      if (node.type === 'TSInterfaceDeclaration') {
        const name = node.id?.name || 'AnonymousInterface';
        const properties:IPropertyInfo[] = [];
        const methods:IMethodInfo[] = [];

        node.body?.body?.forEach((member: any) => {
           if (member.type === 'TSPropertySignature') {
             properties.push({
               name: member.key?.name || 'unknown',
               line: member.loc?.start?.line || 0,
               type: 'any', // Type extraction requires more complex AST handling
               visibility: 'public',
               description: this.getJSDocComment(member, ast)
             });
           } else if (member.type === 'TSMethodSignature') {
             methods.push({
               name: member.key?.name || 'unknown',
               line: member.loc?.start?.line || 0,
               params: member.params?.map((p: any) => p.name || this.getParamName(p)) || [],
               isAsync: false, // Interfaces don't have async implementation details usually
               visibility: 'public',
               description: this.getJSDocComment(member, ast)
             });
           }
        });

        interfaces.push({
          name,
          line: node.loc?.start?.line || 0,
          properties,
          methods,
          isExported: this.isNodeExported(node),
          extends: node.extends?.map((e: any) => e.expression?.name || 'unknown'),
          description: this.getJSDocComment(node, ast)
        });
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
            // Guard against cyclic references or non-node objects if any
          if (Array.isArray(node[key])) {
            node[key].forEach((child: any) => traverse(child));
          } else {
            traverse(node[key]);
          }
        }
      }
    };

    traverse(ast);
    return interfaces;
  }

  private isNodeExported(node: any): boolean {
    if (!node) return false;
    
    let current = node;
    while (current) {
      if (current.type === 'ExportNamedDeclaration' || 
          current.type === 'ExportDefaultDeclaration') {
        return true;
      }
      current = current.parent;
    }
    
    return false;
  }

  private extractTypes(ast: any): ITypeAliasInfo[] {
    const types: ITypeAliasInfo[] = [];
    const traverse = (node: any) => {
      if (!node) return;
      if (node.type === 'TSTypeAliasDeclaration') {
        types.push({
          name: node.id?.name || 'AnonymousType',
          line: node.loc?.start?.line || 0,
          value: 'complex type',
          isExported: this.isNodeExported(node),
          description: this.getJSDocComment(node, ast)
        });
      }
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) node[key].forEach((child: any) => traverse(child));
          else traverse(node[key]);
        }
      }
    };
    traverse(ast);
    return types;
  }

  private extractDecorators(node: any): IDecoratorInfo[] {
    const decorators = node.decorators || node.declaration?.decorators || [];
    return decorators.map((d: any) => {
      const expression = d.expression;
      let name = 'unknown';
      let args: string[] = [];
      if (expression.type === 'Identifier') name = expression.name;
      else if (expression.type === 'CallExpression') {
        name = expression.callee?.name || 'unknown';
        args = expression.arguments?.map((arg: any) => arg.value || 'expression') || [];
      }
      return { name, arguments: args };
    });
  }

  private getJSDocComment(node: any, ast: any): string | undefined {
    if (!ast.comments || !node.loc) return undefined;
    const nodeStartLine = node.loc.start.line;
    const comment = ast.comments.find((c: any) => c.loc.end.line === nodeStartLine - 1);
    if (comment && comment.type === 'Block') {
      return comment.value.replace(/\/\*+|\*+\/|\*/g, '').split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0).join(' ');
    }
    return undefined;
  }

  private calculateComplexity(node: any): number {
    let complexity = 1;
    const traverse = (n: any) => {
      if (!n) return;
      if (['IfStatement', 'WhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement', 'DoWhileStatement', 'ConditionalExpression', 'SwitchCase'].includes(n.type)) {
        complexity++;
      }
      if (n.type === 'LogicalExpression' && (n.operator === '&&' || n.operator === '||')) {
        complexity++;
      }
      for (const key in n) {
        if (n[key] && typeof n[key] === 'object') {
          if (Array.isArray(n[key])) n[key].forEach((child: any) => traverse(child));
          else traverse(n[key]);
        }
      }
    };
    traverse(node);
    return complexity;
  }
}
