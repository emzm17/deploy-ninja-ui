import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [githubLink, setGithubLink] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDeployButtonDisabled, setDeployButtonDisabled] = useState(false);
  const [activeUrl, setActiveUrl] = useState("");
  const [customCommandOutput, setCustomCommandOutput] = useState("");

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

    // Reset URL and error message before starting the deployment
    setActiveUrl("");
    setErrorMessage("");
    setNotifications([]); // Clear previous notifications
    setLoading(true);
    setDeployButtonDisabled(true);

    // Log the custom command being used for deployment
    console.log("Custom Command:", customCommand || "npm run build");

    try {
      const apiUrl = `${process.env.REACT_APP_API_URL}/deploy`;
      const response = await axios.post(apiUrl, {
        githubUrl: githubLink,
        command: customCommand || "npm run build" // Default to 'npm run build' if no custom command is provided
      });

      if (response.status === 200) {
        const { subdomain, id } = response.data;
        startPolling(id, subdomain);
      } else {
        setErrorMessage(`Deployment failed: ${response.statusText}`);
        setDeployButtonDisabled(false);
      }
    } catch (error) {
      setErrorMessage("Error during deployment. Please try again later.");
      console.error(error);
      setDeployButtonDisabled(false);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (id, subdomain) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/status`, {
          params: { id, subdomain },
        });

        const updatedNotification = {
          ...response.data,
          blink: response.data.status !== "ACTIVE",
        };

        setNotifications([updatedNotification]);

        if (response.data.status === "ACTIVE") {
          clearInterval(interval);
          setDeployButtonDisabled(false);
          setActiveUrl(`http://${subdomain}.deploy-ninja.me/`);
        } else if (response.data.status === "FAILED") {
          clearInterval(interval);
          setDeployButtonDisabled(false);
          setNotifications([]); // Clear notifications on failed status
          setActiveUrl(""); // Clear the active URL on failed status
          setErrorMessage(`Deployment failed for subdomain ${subdomain}`);
        }
      } catch (error) {
        console.error("Error fetching status", error);
      }
    }, 10000);

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
        <input
          type="text"
          placeholder="Enter custom command (optional)..."
          value={customCommand}
          onChange={(e) => setCustomCommand(e.target.value)}
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
      {customCommandOutput && <div className="command-output">{customCommandOutput}</div>}
    </div>
  );
};

export default App;
