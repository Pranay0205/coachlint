const apiClient = require("./apiClient");

async function postCurrentError(errDetails, apiKey = null) {
  try {
    console.log(errDetails)

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (apiKey) {
      config.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await apiClient.post("/current-error", errDetails, config);

    console.log(`current error function response: ${response.data}`);

    return response.data;

  } catch (error) {
    console.error("Failed to post error details:", error);
    throw error; 
  }
}

async function postHoverError(errDetails, apiKey = null) {
  try {
    console.log(errDetails)
  
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (apiKey) {
      config.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await apiClient.post("/hover-error", errDetails, config);

    console.log(`hover error function response: ${response.data}`);

    return response.data;

  } catch (error) {
    console.error("Failed to post error details:", error);
    throw error; 
  }
}

module.exports = {postCurrentError, postHoverError}