/**
 * WebGazer ThreadedRidge worker entry point
 * This file is required by webgazer for threaded regression
 */

// Track if worker has been initialized
let workerInitialized = false;

// Initialize the worker
export function initializeWorker() {
  if (workerInitialized) {
    return;
  }
  console.log('initialized worker');
  workerInitialized = true;
}

// Perform ridge regression in the main thread as fallback
export function performRidgeRegression(X, y, lambda = 1) {
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