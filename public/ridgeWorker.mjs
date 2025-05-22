/**
 * Ridge Worker for WebGazer.js
 */

self.addEventListener('message', function(e) {
  const { action, data } = e.data;
  
  switch(action) {
    case 'train':
      // Handle training data
      if (data.X && data.y) {
        const result = ridgeRegression(data.X, data.y, data.lambda);
        self.postMessage({ action: 'trainComplete', result });
      }
      break;
      
    case 'predict':
      // Handle prediction request
      if (data.X && data.weights) {
        const result = predict(data.X, data.weights);
        self.postMessage({ action: 'predictComplete', result });
      }
      break;
      
    default:
      console.error('Unknown action in ridgeWorker:', action);
  }
});

/**
 * Ridge regression implementation
 * @param {Array} X - Input features matrix
 * @param {Array} y - Target values vector
 * @param {Number} lambda - Regularization parameter
 * @returns {Array} Weights vector
 */
function ridgeRegression(X, y, lambda = 1) {
  // Simple ridge regression implementation
  try {
    // Number of samples and features
    const n = X.length;
    const p = X[0].length;
    
    // Create the identity matrix multiplied by lambda
    const lambdaI = Array(p).fill().map((_, i) => {
      return Array(p).fill().map((_, j) => i === j ? lambda : 0);
    });
    
    // Calculate X^T * X + lambda * I
    const XtX = matrixMultiply(matrixTranspose(X), X);
    const regMatrix = matrixAdd(XtX, lambdaI);
    
    // Calculate (X^T * X + lambda * I)^-1
    const invRegMatrix = matrixInverse(regMatrix);
    
    // Calculate (X^T * X + lambda * I)^-1 * X^T
    const leftSide = matrixMultiply(invRegMatrix, matrixTranspose(X));
    
    // Calculate (X^T * X + lambda * I)^-1 * X^T * y
    const weights = matrixVectorMultiply(leftSide, y);
    
    return weights;
  } catch (error) {
    console.error('Error in ridge regression:', error);
    return Array(X[0].length).fill(0); // Return zeros as fallback
  }
}

/**
 * Predict output values using trained weights
 * @param {Array} X - Input feature matrix
 * @param {Array} weights - Trained weights
 * @returns {Array} Predicted values
 */
function predict(X, weights) {
  return X.map(row => {
    return row.reduce((sum, value, index) => sum + value * weights[index], 0);
  });
}

// Matrix utility functions

function matrixTranspose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array(cols).fill().map(() => Array(rows).fill(0));
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }
  
  return result;
}

function matrixMultiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;
  
  if (colsA !== rowsB) {
    throw new Error('Matrix dimensions do not match for multiplication');
  }
  
  const result = Array(rowsA).fill().map(() => Array(colsB).fill(0));
  
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  
  return result;
}

function matrixVectorMultiply(matrix, vector) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  if (cols !== vector.length) {
    throw new Error('Matrix and vector dimensions do not match for multiplication');
  }
  
  const result = Array(rows).fill(0);
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i] += matrix[i][j] * vector[j];
    }
  }
  
  return result;
}

function matrixAdd(A, B) {
  const rows = A.length;
  const cols = A[0].length;
  
  if (rows !== B.length || cols !== B[0].length) {
    throw new Error('Matrix dimensions do not match for addition');
  }
  
  const result = Array(rows).fill().map(() => Array(cols).fill(0));
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] + B[i][j];
    }
  }
  
  return result;
}

function matrixInverse(matrix) {
  // Simplified version for small matrices - not numerically stable for large matrices
  // For production code, consider using a library
  const n = matrix.length;
  
  // Create augmented matrix [A|I]
  const augmented = matrix.map((row, i) => {
    const augRow = [...row];
    for (let j = 0; j < n; j++) {
      augRow.push(i === j ? 1 : 0);
    }
    return augRow;
  });
  
  // Gauss-Jordan elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let max = Math.abs(augmented[i][i]);
    let maxRow = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(augmented[j][i]) > max) {
        max = Math.abs(augmented[j][i]);
        maxRow = j;
      }
    }
    
    // Swap rows if needed
    if (maxRow !== i) {
      const temp = augmented[i];
      augmented[i] = augmented[maxRow];
      augmented[maxRow] = temp;
    }
    
    // Normalize the pivot row
    const pivot = augmented[i][i];
    if (Math.abs(pivot) < 1e-10) {
      throw new Error('Matrix is singular or nearly singular');
    }
    
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate other rows
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        const factor = augmented[j][i];
        for (let k = 0; k < 2 * n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
  }
  
  // Extract the inverse matrix from the right half of the augmented matrix
  return augmented.map(row => row.slice(n));
} 