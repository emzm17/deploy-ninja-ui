import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [githubLink, setGithubLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDeployButtonDisabled, setDeployButtonDisabled] = useState(false); // State to control button disabling
  const [activeUrl, setActiveUrl] = useState(""); // State to store the active URL

  const isValidGithubURL = (url) => {
    const githubRepoRegex = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
    return githubRepoRegex.test(url);
  };

  const handleDeploy = async () => {
    if (!githubLink.trim() || !isValidGithubURL(githubLink)) {
      setErrorMessage(
        "Invalid GitHub link. Please provide a valid repository URL (e.g., https://github.com/username/repository)."
      );
      return;
    }

    setErrorMessage("");
    setLoading(true);
    setDeployButtonDisabled(true); // Disable the deploy button

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/deploy`;

      // Send GitHub URL in the JSON body of the POST request
      const response = await axios.post(apiUrl, {
        githubUrl: githubLink,
      });

      if (response.status === 200) {
        const { subdomain, id } = response.data; // Extract id and subdomain from the response
        startPolling(id, subdomain); // Start polling with the id and subdomain
      } else {
        setErrorMessage(`Deployment failed: ${response.statusText}`);
        setDeployButtonDisabled(false); // Re-enable button if there's an error
      }
    } catch (error) {
      setErrorMessage("Error during deployment. Please try again later.");
      console.error(error);
      setDeployButtonDisabled(false); // Re-enable button if there's an error
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id, subdomain) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/status`, {
          params: {
            id: id, // Use 'uuid' to match the server-side parameter
            subdomain,          // Ensure the parameter names match the server-side code
          },
        });

        const updatedNotification = {
          ...response.data,
          blink: response.data.status !== "ACTIVE", // Add blink property based on status
        };

        // Update notifications with the latest response data
        setNotifications([updatedNotification]);

        // Check if the status is "ACTIVE" to stop polling and show the active URL
        if (response.data.status === "ACTIVE") {
          clearInterval(interval);
          setDeployButtonDisabled(false); // Re-enable the deploy button
          setActiveUrl(`http://${subdomain}.deploy-ninja.me/`); // Set the active URL
        }
      } catch (error) {
        console.error("Error fetching status", error);
      }
    }, 10000); // Poll every 10 seconds

    // Return the cleanup function to clear interval on component unmount
    return () => clearInterval(interval);
  };

  return (
    <div className="container">
      <h1>
        <i className="fab fa-github"></i>Deploy your application with one click
      </h1>
      <div className="input-container">
        <input
          type="text"
          placeholder="Paste GitHub link..."
          value={githubLink}
          onChange={(e) => setGithubLink(e.target.value)}
        />
        <button onClick={handleDeploy} disabled={isDeployButtonDisabled}>
          {isDeployButtonDisabled ? "Deploying..." : "Deploy"}
        </button>
      </div>
      {errorMessage && <div className="error">{errorMessage}</div>}
      <div className="notifications">
        <div className="notification-list">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`notification-item ${notification.blink ? "blink" : ""}`}
            >
              Your subdomain is <strong>{notification.subdomain}</strong> and status is <strong>{notification.status}</strong>.
            </div>
          ))}
          {activeUrl && (
            <div className="active-url">
              Your URL is: <a href={activeUrl} target="_blank" rel="noopener noreferrer">{activeUrl}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
