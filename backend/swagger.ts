import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "MedGemma API",
    description: "API documentation",
  },
  host: "localhost:3000", // change if needed
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/index.ts"]; // <-- change if your entry file is different

async function generateSwagger() {
  await swaggerAutogen({ openapi: "3.0.0" })(
    outputFile,
    endpointsFiles,
    doc
  );

  console.log("Swagger generated!");
}

generateSwagger().catch(console.error);