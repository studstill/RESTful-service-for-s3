# To Test:

- Open a terminal window and type `mongod`
- Open another terminal window and clone this repo to a local directory
- In the cloned repo directory, type `npm install`

>NOTE: In order to test the s3 funtionality of this program, you must create and set environment variables for the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY with the credentials for your own s3 account.
>http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Credentials_from_Environment_Variables

- Then type `npm test`

#Purpose of this application

This app will have a collection of users, and each user will have a collection of files. However, this API will not accept actual files, nor will it return actual files (HTTP with binary data, while possible, is a little messy for the purposes of this assignment). Instead, when creating a new file, you will post a json representation of a file, such as:

superagent /users/:user/files post ' {"fileName": "fileOne": "content": "hello world!"}

On the backend, a file named fileOne will be created with the contents "hello world!".

Next, instead of saving this file to a mongo database, it will be saved to an s3 bucket that has the name as a user, and the name of the file will match the name specified in the initial post request.

Then the url to retrieve this file from S3 will then be stored in a mongo database.

When serving a get request for the file. i.e. GET /users/:user/files/:file, a json object will be returned that contains the url to the file location on S3.

As files are owned by users, this application uses nested resources.

In an attempt to be as RESTful as possible, this app contains the following routes and associated operations:

- GET /users

- POST /users

- GET /users/:user

- PUT /users/:user (renames a user and user's bucket)

- DELETE /users/:user

- GET /user/:user/files

- POST /user/:user/files

- GET /user/:user/files/:file

- PUT /user/:user/files/:file (replaces an already existing file, or updates it)



