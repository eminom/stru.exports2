
%{

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <assert.h>

#define YYSTYPE char*

#include "lib/sewrite.h"

int yylex(void);
void yyerror(char*);
extern int yylineno;

//#define DBG(...)
#define DBG(...)	{fprintf(stderr,__VA_ARGS__);fprintf(stderr,"\n");}


%}

%token TokenStruct
%token TokenClass
%token ConstString
%token Var
%token TokenSemicolon
%token TokenLeftBracket
%token TokenRightBracket
%token TokenLeftOpen
%token TokenRightEnd
%token TokenComma
%token TokenArrow

%%
StructDefinition:
StructHead StructBody TokenSemicolon {
	DBG("StructDefinition defined");
}

StructHead:
TokenStruct Var TokenArrow TokenLeftBracket ExportingClass TokenComma ConstString TokenRightBracket {
	DBG("Struct %s is present, meta = %s", $2, $7);
	curStru = se_createStruLink($2, curExporting, $7, curStru);
	//release
	free(curExporting);
	curExporting = 0;
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

Param:Var Var{
	curParam = se_createParamLink($1, vt_Primitive, curParam);
	free($1);
}
|Var {
	curParam = se_createParamLink($1, vt_Primitive, curParam);
	free($1);
}
|TokenClass Var{
	curParam = se_createParamLink($2, vt_Class, curParam);
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

	se_writeStruLink(curStru);
	se_disposeStruLink(curStru);
	//printf("Parsing done\n");
}



