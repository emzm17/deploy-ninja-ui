import React, { useState } from "react";
import axios from "axios"; // Import axios
import "./App.css";



const App = () => {
  const [githubLink, setGithubLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidGithubURL = (url) => {
    // Regex to validate GitHub repository URLs
    const githubRepoRegex = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
    return githubRepoRegex.test(url);
  };

  const handleDeploy = async () => {
    if (!githubLink.trim() || !isValidGithubURL(githubLink)) {
      setErrorMessage("Invalid GitHub link. Please provide a valid repository URL (e.g., https://github.com/username/repository).");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      console.log("Sending GitHub link to backend:", githubLink); // Log URL for verification

      // Send GitHub URL in the JSON body of the POST request
      const response = await axios.post(apiUrl, {
        githubUrl: githubLink,  // Pass githubUrl as part of the JSON body
      });

      if (response.status === 200) {
        alert(`Successfully deployed: ${githubLink}`);
      } else {
        setErrorMessage(`Deployment failed: ${response.statusText}`);
      }
    } catch (error) {
      setErrorMessage("Error during deployment. Please try again later.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>
        Paste <i className="fab fa-github"></i>Deploy your application with one click
      </h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Paste GitHub link..."
          value={githubLink}
          onChange={(e) => setGithubLink(e.target.value)}
        />
        <button onClick={handleDeploy} disabled={loading}>
          {loading ? "Deploying..." : "Deploy"}
        </button>
      </div>
      {errorMessage && <div className="error">{errorMessage}</div>}
    </div>
  );
};

export default App;
