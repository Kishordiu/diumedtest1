import modelWeights from './model_weights.json';

interface LinearModel {
  name: string;
  type: 'linear' | 'logistic';
  weights: number[];
  bias: number;
}

const getModel = (name: string): LinearModel => {
  const model = (modelWeights as Record<string, any>)[name];
  if (!model) {
    throw new Error(`Model ${name} not found in model_weights.json`);
  }
  return model as LinearModel;
};

/**
 * Executes a linear regression model locally.
 * y = w1*x1 + w2*x2 + ... + bias
 */
export function predictLinear(modelName: string, features: number[]): number {
  const model = getModel(modelName);
  if (model.type !== 'linear') throw new Error(`Model ${modelName} is not a linear model`);
  if (features.length !== model.weights.length) {
    throw new Error(`Feature mismatch for ${modelName}: Expected ${model.weights.length}, got ${features.length}`);
  }
  
  let result = model.bias;
  for (let i = 0; i < features.length; i++) {
    result += features[i] * model.weights[i];
  }
  return result;
}

/**
 * Executes a logistic regression classifier locally.
 * y = 1 / (1 + exp(-(w*X + b)))
 */
export function predictLogistic(modelName: string, features: number[]): number {
  const model = getModel(modelName);
  if (model.type !== 'logistic') throw new Error(`Model ${modelName} is not a logistic model`);
  if (features.length !== model.weights.length) {
    throw new Error(`Feature mismatch for ${modelName}: Expected ${model.weights.length}, got ${features.length}`);
  }
  
  let logit = model.bias;
  for (let i = 0; i < features.length; i++) {
    logit += features[i] * model.weights[i];
  }
  
  // Sigmoid activation
  return 1 / (1 + Math.exp(-logit));
}
