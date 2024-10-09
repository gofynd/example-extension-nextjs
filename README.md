
# Build a Fynd Extension using Node.js + Next.js
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![NextJS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)

[![Coverage Status][coveralls-badge]]([coveralls-url])

This project outlines the development process for a Fynd extension that displays product listings for a company and its associated applications. By following this guide, you'll be able to set up the development environment, build the extension locally, and understand the testing procedures.

## Quick start
### Prerequisites
* You have installed globally [Node 18.X.X](https://docs.npmjs.com/) or above version.
* You have fdk-cli installed [install](https://github.com/gofynd/fdk-cli)
* You have created a [partner account](https://partners.fynd.com).
* You have created a [development account](https://partners.fynd.com/help/docs/partners/testing-extension/development-acc#create-development-account) and [populated test data](https://partners.fynd.com/help/docs/partners/testing-extension/development-acc#populate-test-data) in it.

## Install Template Locally
To initialize your extension template locally, run the following command:
```shell
fdk extension init --template <TODO>
```
Enter your preferred extension name and type, and you are all set.

## Local Development
To start local development, execute the following command:
```shell
fdk extension preview
```
This command will provide a partner’s panel URL where you can interact with your extension. For more information, please read this [guide](https://github.com/gofynd/fdk-cli?tab=readme-ov-file#extension-commands).

## Docker Instructions

To run the application using Docker in Production environment, follow these steps:
* Build the Docker image:
    ```shell
    docker build -t extension .
    ```
* Run the Docker container
  ```
  docker run -p 8080:8080 extension 
  ```

To Run the extension with Docker locally, ensure you first prepare your environment:

- Copy the .env.example file and rename it to .env at the root of your project.
- Fill in all the required values in the .env file.

After setting up your .env file, you can proceed with the Docker commands listed above to build and run your extension locally. 

## Directory structure
Below is the structure of the project directory along with brief descriptions of the main components:

```.
├── README.md                      # Project documentation
├── fdk.ext.config.json            # Configuration file for FDK extension
├── index.js                       # Entry point for the application.
├── jest.config.mjs                # Jest configuration for unit tests
├── next.config.mjs                # Custom configuration for Next.js.
├── package-lock.json              # Lockfile for npm dependencies
├── package.json                   # Project metadata and dependencies
├── public                         # Static assets folder.
│   ├── assets                     # Folder for images and other static files.
└── src                            # Source code for the application.
    ├── tests                      # Test case folder
        ├── __mocks__              # Mock files for testing.
        ├── __tests__              # Test files for unit and integration tests.
    ├── app                        # Application components and layouts.
    │   ├── fonts                  # Custom fonts used in the app.
    │   ├── globals.css            # Global styles applied throughout the app.
    │   ├── layout.js              # Main layout component for the app.
    │   └── page.module.css        # Module-specific styles for pages.
    └── pages                      # Next.js pages directory.
        ├── company                # Dynamic route handling for company-related pages.
        │   └── [...params].js     # Catch-all route for handling various parameters.
        └── style                  # Styles specific to the pages.
            └── index.css          # CSS for the index page.
```

[coveralls-badge]: https://coveralls.io/repos/github/gofynd/example-extension-nextjs/badge.svg?branch=main&&kill_cache=1
[coveralls-url]: https://coveralls.io/github/gofynd/example-extension-nextjs?branch=main
