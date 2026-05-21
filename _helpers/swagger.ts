import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const router = express.Router();

// Load swagger.yaml from project root (same level as this file is in _helpers/)
const swaggerDocument = YAML.load(path.resolve(__dirname, '../swagger.yaml'));

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;