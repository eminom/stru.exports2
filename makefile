SOURCE = y.tab.c\
	lex.yy.c\
	lib/json/cJSON.c\
	lib/sewrite.c
	
all:
	yacc -d stru2.y
	flex stru2.l
	gcc -std=c99 ${SOURCE} -o parser

clean:
	rm -rf parser

	