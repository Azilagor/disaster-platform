const dotenv = require("dotenv");
dotenv.config();

const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "Disaster Platform API",
    description: "API documentation",
  },
  host: `localhost:${process.env.PORT || 4001}`,
  schemes: ["https"],
};

const outputFile = "./swagger-output.json";

const endpointsFiles = [
  "./server.js",
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("✅ swagger-output.json generated");
});
