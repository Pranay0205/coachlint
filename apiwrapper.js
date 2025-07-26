const apiClient = require("./apiClient");

async function postErrorDetails(errDetails) {
  try {
    console.log(errDetails)
    const response = await apiClient.post("/explain-error", errDetails);

    console.log(response.data);
    return response.data;

  } catch (error) {

    console.error("Failed to post error details:", error);
    throw error; 

  }
}

module.exports = {postErrorDetails}