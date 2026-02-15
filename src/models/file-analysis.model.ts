export interface IFileAnalysis {
  path: string;
  relativePath: string;
  language: string;
  size: number;
  content: string;
  ast?: any;
  functions: IFunctionInfo[];
  classes: IClassInfo[];
  imports: IImportInfo[];
  exports: IExportInfo[];
  enums?: IEnumInfo[];
  interfaces?: IInterfaceInfo[];
  types?: ITypeAliasInfo[];
}

export interface IDecoratorInfo {
  name: string;
  arguments?: string[];
}

export interface ITypeAliasInfo {
  name: string;
  line: number;
  value: string;
  isExported: boolean;
  description?: string;
}

export interface IEnumInfo {
  name: string;
  line: number;
  members: string[];
  isExported: boolean;
}

export interface IInterfaceInfo {
  name: string;
  line: number;
  properties: IPropertyInfo[];
  methods: IMethodInfo[];
  isExported: boolean;
  extends?: string[];
  description?: string;
}

export interface IFunctionInfo {
  name: string;
  line: number;
  params: string[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  complexity?: number;
  description?: string;
  decorators?: IDecoratorInfo[];
}

export interface IClassInfo {
  name: string;
  line: number;
  methods: IMethodInfo[];
  properties: IPropertyInfo[];
  isExported: boolean;
  extends?: string;
  implements?: string[];
  description?: string;
  decorators?: IDecoratorInfo[];
}

export interface IMethodInfo {
  name: string;
  line: number;
  params: string[];
  returnType?: string;
  isAsync: boolean;
  visibility: "public" | "private" | "protected";
  description?: string;
  decorators?: IDecoratorInfo[];
  complexity?: number;
}

export interface IPropertyInfo {
  name: string;
  line: number;
  type?: string;
  visibility: "public" | "private" | "protected";
  description?: string;
  decorators?: IDecoratorInfo[];
}

export interface IImportInfo {
  source: string;
  imports: string[];
  isDefault: boolean;
}

export interface IExportInfo {
  name: string;
  type: "function" | "class" | "variable" | "type";
}