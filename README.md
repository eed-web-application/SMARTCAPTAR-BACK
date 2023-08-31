# Smart Captar Backend
## Overview
Smart captars backend
## Prerequisites

 - Install the latest Version of Node.js
 - Clone the Project
 - Unzip instantclient_21_6 (Needed for Node-OracleDB

## Running the Backend
### Back End: Express.js
In the root folder of the project, run this command in the terminal. It will be hosted on port 5000
`npm start`

## Back End: Express
Express.js, or simply Express, is a back end web application framework for building RESTful APIs with Node.js, released as free and open-source software under the MIT License. It is designed for building web applications and APIs. It has been called the de facto standard server framework for Node.js
Source Express.js: https://expressjs.com/
Source Node.js: https://nodejs.org/en

### Dependencies
#### Node-Oracledb
The node-oracledb driver for Node.js powers high performance Oracle Database applications written in JavaScript or TypeScript.Node-oracledb is a pure JavaScript module that can connect directly to Oracle Database. Some additional features are available in an optional 'Thick' mode that uses Oracle Client libraries to connect to the database.
Source: https://oracle.github.io/node-oracledb/

## User API's

###  GET /getAdmins
Headers
* AREACODE

Response
* JSON

Description
Fetches all approvers given an areacode

### GET  /getAllUsers
Headers
* none

Response
* JSON

Description
Fetches every user in the SMARTCAPTAR_USERS table

### GET  /getAllProjects
Headers
* none

Response
* JSON

Description
Fetches every project in the SMARTCAPTAR_PROJECTS table

### POST /addUser
Headers
* user: slac username
* admin: if the user is an admin or not
* projects: list of projects a user is an approver of

Response
* 200

Description
Adds a user to a project in which they can approve cables for

### POST  /modifyUser
Headers
* user
* oldProjects
* admin
* projects

Response
* 200

Description
Deletes or adds projects to a user by passing in the projects they currently have and a list of projects they requested to join. 


### POST  /deleteUser
Headers
* user
* projects

Response
* 200

Description
Deletes a user an every project they have been assigned an approver of

### POST  /addProject
Headers
* project
* prefix
* area

Response
* 200

Description
Inserts a new row into the SMARTCAPTAR_PROJECTS table

### GET  /addToWorkspace
Headers
* cable
* user

Response
* JSON

Description
Adds a cable from the CABLEINV table to the users workspace in SMARTCAPTAR_UPLOAD
## Cable API's
### POST  /csvUploadConnectors
Headers
* arr

Response
* 200

Description
CSV Upload connector list, the front end parses this into a json then makes this request.

### POST  /csvUploadUsers
Headers
* arr

Response
* 200

Description
ADMIN uploads a CSV of users to update the SMARTCAPTAR_USER table

### GET  /getCablesInventory
Headers
* table
* offset
* user
* txt
* filter

Response
* JSON

Description
Returns cables from CABLEINV to be displayed. The offset is used for table pagination. txt and filter is used to filter the cables based on user preferences

### GET  /getCables
Headers
* table
* user

Response
* JSON

Description
Fetches cables from the desired table but only cables entered by the user

### GET  /getCableTypes
Headers
* none

Response
* JSON

Description
Fetches all cable types from SMARTCAPTAR_COMPATIBILITY


### GET  /getConnTypes
Headers
* cableType

Response
* JSON

Description
Fetches all connector types for the specified cableType

### GET  /getCompatibility
Headers
* none

Response
* JSON

Description
Fetch all Rows from SMARTCAPTAR_COMPATIBILITY

### GET  /getCableHistory
Headers
* cable

Response
* JSON

Description
Fetches the version history for a cable submitted

### POST  /uploadCables
Headers
* cablesUpload
* user

Response
* 200

Description
Inserts rows into SMARTCAPTAR_UPLOAD

### POST /createCable
Headers
* cable
* user

Response
* 200

Description
Inserts a single row into SMARTCAPTAR_UPLOAD

### POST  /checkCables
Headers
* cablesUpload

Response
* JSON

Description
Checks each cable being uploaded by a csv, checks for duplicates and cables already in a workspace. 

### POST  /queueCables
Headers
* cablesUpload

Response
* JSON

Description
Inserts cables from SMARTCAPTAR_UPLOAD to SMARTCAPTAR_QUEUE

### POST  /updateCable
Headers
* cable
* user

Response
* 200

Description
Updates cable information in SMARTCAPTAR_UPLOAD

### POSTS /rejectCables
Headers
* cable
* user

Response
* 200

Description
Changes status of cable in SMARTCAPTAR_QUEUE to REJECTED and moves it back to the workspace

### POST  /approveCables
Headers
* cable
* user

Response
* JSON

Description
Approves cables and calls the INSERTCABLETOINV helper function

## Helper Functions
### InsertIntoCableINV

Description
For each cable, use the LoadData procedure that is in the CAPTAR database to insert a cable into the final target table.

### addApproverToCables
Description
For each cable, adds the user as an approver for each one. 
