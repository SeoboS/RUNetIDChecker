# RUNetIDChecker
Automates checking a RU student's netid against several search queries.  

#### Features:  
* Reads a .csv file with a list of netids and search queries
* Can add an unlimited amount of search queries
* Returns the number of validated netids and number of invalid netids
* Reports in a file, which search queries failed and the invalid netids
* Random wait time added in between searches  

#### Notes:

#### TODO:
* Read/Write results from Google Sheets document

## How to install:
1. Download files into any folder
2. Enable Developer mode in chrome browser
3. Visit chrome://extensions
4. Select the folder with downloaded files using the "Load unpacked extension" option


## How to use:
1. Navigate to Rutgers NetID Lookup tool: https://sakai.rutgers.edu/addpart-lookup.jsp
2. Ensure that you are logged into your Rutgers account (Required for doing searches)
3. Upload formatted file into the chrome extension
4. Your browser should start looking up the list of NetId's. Leave your browser open and in this window until it finishes
5. Results and any invalid errors can be downloaded as files from the chrome extension


### File format for .csv file:
netid, search term 1, search term 2, ....

If I want to see student with netid ss2468 is in school of engineering and has graduation date 2021.
#### Example:
ss2468, SCHOOL OF ENGINEERING, /18
ss2467, SCHOOL OF ENGINEERING, /20 