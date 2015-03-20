
%{

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <assert.h>

#define YYSTYPE char*

#include "sewrite.h"
#include "stru_config.h"
int yylex(void);
void yyerror(char*);
extern int yylineno;

extern char* strdup(const char*);

#define FREE(_A)	{free(_A);_A=0;}
#define CHECK_FREE(A)	if(A)FREE(A)

#define AssertNull(a)	{if(a){fprintf(stderr, "\"%s\" is not null !\n", #a);}}

%}

%token TokenConst
%token TokenStruct
%token TokenClass
%token ConstString
%token ConstInteger
%token ConstFloat
%token ConstBoolean
%token Var
%token TokenSemicolon
%token TokenLeftBracket
%token TokenRightBracket
%token TokenLeftOpen
%token TokenRightEnd
%token TokenComma
%token TokenArrow
%token TokenStar
%token TokenStatic
%token TokenEqual;

%%

Program:
StatementOp{}

Statement:
StructDefinition{}
|StaticDefinition{}

StatementOp:
Statement StatementOp{}
|{}

StaticDefinition:
TokenStatic StaticMethodReturnType TokenStar StaticMethodName TokenLeftBracket ParamOp TokenRightBracket TokenSemicolon{
	curStaticLink = se_createStaticLink(stMethodName, stMethodType
		,curParam, curStaticLink);
	curParam = 0;
	FREE(stMethodType)
	FREE(stMethodName)
}

StaticMethodReturnType:
Var{
	CHECK_FREE(stMethodType)
	stMethodType = $1;
}

StaticMethodName:
Var{
	CHECK_FREE(stMethodName)
	stMethodName = $1;
}

StructDefinition:
StructHead StructBody TokenSemicolon {
	DBG("StructDefinition defined");
}

StructHead:
TokenStruct Var TokenArrow TokenLeftBracket ExportingClass TokenComma ConstString DerivesOp TokenRightBracket {
	DBG("Struct %s is present, meta = %s", $2, $7);
	curStru = se_createStruLink($2, curExporting, $7, curDeriving, curStru);
	//release
	FREE(curExporting)
	CHECK_FREE(curDeriving)
	free($2);
	free($7);
	
}

ExportingClass:
TokenClass Var {
	DBG("Exporting-class %s is present", $2);
	if(curExporting){
		fprintf(stderr, "UNEXPECTING %s\n", curExporting);
		abort();
	}
	curExporting = $2;
}

DerivesOp:
TokenComma TokenClass Var {
	DBG("Deriving-class %s is present", $3);
	CHECK_FREE(curDeriving);
	curDeriving = $3;
}|{
	CHECK_FREE(curDeriving);
}

StructBody:
TokenLeftOpen ObjectMethodsOp TokenRightEnd {
}

ObjectMethodsOp:
ObjectMethod ObjectMethodsOp{}
|{}

ObjectMethod:
MethodHead TokenLeftBracket ParamOp TokenRightBracket TokenSemicolon{
	DBG("Method Type(%s) Name(%s) is defined", methodType, methodName);
	if(!curStru){
		fprintf(stderr,"No structure scope!\n");
		abort();
	}
	curStru->methods = se_createMethodLink(methodName, methodType
		, curParam, curStru->methods);

	free(methodName);
	free(methodType);
	methodName = 0;
	methodType = 0;
	curParam = 0;
}

MethodHead:
Var Var{
	if(methodType){
		free(methodType);
		methodType = 0;
	}
	methodType = $1; //Already duplicated.
	if(methodName){
		free(methodName);
		methodName = 0;
	}
	methodName = $2; //Already copied'
}

ParamOp:
Param ParamTail{}
|{/*None*/}

ParamTail:
TokenComma Param ParamTail{}
|{}

Param:VarType Var{
	curParam = se_createParamLink(curVarType, vt_Primitive, 0, curParam);

	FREE(curVarType)
}
|VarType {
	curParam = se_createParamLink(curVarType, vt_Primitive, 0, curParam);
	FREE(curVarType)
}
|TokenClass Var{
	curParam = se_createParamLink($2, vt_Class, 0, curParam);
	free($2);
}
|VarType TokenEqual Constant {
	curParam = se_createParamLink(curVarType, vt_Primitive, curParamDefault, curParam);
	FREE(curVarType);
	curParamDefault = 0; //Detached
}
|VarType Var TokenEqual Constant {
	curParam = se_createParamLink(curVarType, vt_Primitive, curParamDefault, curParam);

	free($2);
	FREE(curVarType)
	curParamDefault = 0; //Detached
}

Constant:
ConstString{
	AssertNull(curParamDefault)
	curParamDefault = se_createParamDefault(dt_String, $1);
	free($1);
}
|ConstInteger{
	AssertNull(curParamDefault)
	curParamDefault = se_createParamDefault(dt_Integer, $1);
	free($1);
}|ConstFloat {
	AssertNull(curParamDefault)
	curParamDefault = se_createParamDefault(dt_Float, $1);
	free($1);
}|ConstBoolean {
	AssertNull(curParamDefault)
	curParamDefault = se_createParamDefault(dt_Boolean, $1);
	free($1);
}


VarType:
Var{
	//DBG("Pure var-type");
	CHECK_FREE(curVarType)
	curVarType = $1;
}
|TokenConst Var{
	//DBG("Const var-type");
	CHECK_FREE(curVarType)
	int length = (strlen($2) + 1 + 32)*sizeof(char);
	char *buff = (char*)malloc(length);
	memset(buff, 0, length);
	sprintf(buff, "const %s", $2);
	curVarType = buff;
	free($2);
}
|TokenConst Var TokenStar{
	//DBG("Const pointer var-type");
	CHECK_FREE(curVarType)
	int length = (strlen($2) + 1 + 32)*sizeof(char);
	char *buff = (char*)malloc(length);
	memset(buff, 0, length);
	sprintf(buff, "const %s*", $2);
	curVarType = buff;
	free($2);
}

%%

void yyerror(char *err){
	printf("Error:%s, line %d\n", err, yylineno);
}

int main(void){
	if(yyparse()){
		printf("error parsing\n");
		return -1;
	}

	cJSON *root = cJSON_CreateObject();
	se_writeStruLink(root, curStru);
	se_writeStaticLink(root, curStaticLink);

	char *out = cJSON_Print(root);
	printf("%s\n", out);
	free(out);
	cJSON_Delete(root);

	se_disposeStruLink(curStru);
	se_disposeStaticLink(curStaticLink);
	//printf("Parsing done\n");
}



