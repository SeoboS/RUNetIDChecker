# RUNetIDChecker
Automates checking a RU student's netid against a search query

Features:
* Reads a .csv file with a list of netids and search queries.



.csv file format example (can have unlimited amount of search terms):

netid,searchterm1,searchterm2
ss2468,SCHOOL OF ENGINEERING
al93,SCHOOL OF ENGINEERING,/18
yu1,SCHOOL OF ARTS,/17

output:

true
true, false
false, true

searchTerm1 found, searchTerm2 found
al93 is in school of engineering and is not graduating in 2018
yu1 is not in school of arts and science and is graduating in 2017