import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const distSwaggerPath = path.join(__dirname, '..', 'swagger.yaml');
const projectSwaggerPath = path.join(process.cwd(), 'swagger.yaml');
const swaggerPath = fs.existsSync(distSwaggerPath) ? distSwaggerPath : projectSwaggerPath;

const swaggerDocument = YAML.load(swaggerPath);

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;