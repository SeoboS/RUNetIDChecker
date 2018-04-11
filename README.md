# RUNetIDChecker
Automates checking a RU student's netid against several search queries.  

Features:  
* Reads a .csv file with a list of netids and search queries.
* Can add an unlimited amount of search queries
* Returns the number of validated netids and number of invalid netids
* Reports in a file, which search queries failed and the invalid netids
* Random wait time added in between searches  


# Example

**.csv file format example** (can have unlimited amount of search terms):

netid,searchterm1,searchterm2  
ss2468,SCHOOL OF ENGINEERING  
al93,SCHOOL OF ENGINEERING,/18  
yu1,SCHOOL OF ARTS,/17  


**output** (if all search terms found or not [searchterm1 found, searchterm2 found]):  
  
true  
false [true, false]  
false [false, true]  
