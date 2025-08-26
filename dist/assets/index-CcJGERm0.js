// This is a simplified standalone version of the application for file:// protocol compatibility
// This version is designed to work when opened directly from the file system without a server

console.log("Job Selection System (JSS) - Built Application (Standalone Version)");

// Initialize application and signal that JavaScript is working
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    
    try {
        // Show basic application content to verify JavaScript is working
        const root = document.getElementById('root');
        if (root) {
            // Set display to block to override the initial hiding
            root.style.display = 'block';
            
            // Add minimal application shell
            root.innerHTML = `
                <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
                    <header style="background-color: #0047AB; color: white; padding: 20px; border-radius: 8px;">
                        <h1>Job Selection System</h1>
                        <p>Driver job selection portal</p>
                    </header>
                    
                    <main style="margin-top: 20px; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2>Login</h2>
                        
                        <div style="margin-bottom: 20px;">
                            <label for="login-type" style="display: block; margin-bottom: 8px; font-weight: bold;">Select User Type:</label>
                            <select id="login-type" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <option value="driver">Driver</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        
                        <div id="driver-login-form">
                            <div style="margin-bottom: 20px;">
                                <label for="employee-id" style="display: block; margin-bottom: 8px; font-weight: bold;">Employee ID:</label>
                                <input type="text" id="employee-id" placeholder="Enter your 7-digit ID" 
                                    style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <small style="display: block; margin-top: 4px; color: #666;">Example: 1234567</small>
                            </div>
                            
                            <button id="driver-login-btn" style="background-color: #0047AB; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
                                Login as Driver
                            </button>
                        </div>
                        
                        <div id="admin-login-form" style="display: none;">
                            <div style="margin-bottom: 20px;">
                                <label for="admin-password" style="display: block; margin-bottom: 8px; font-weight: bold;">Admin Password:</label>
                                <input type="password" id="admin-password" placeholder="Enter admin password" 
                                    style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                                <small style="display: block; margin-top: 4px; color: #666;">Default: ups123</small>
                            </div>
                            
                            <button id="admin-login-btn" style="background-color: #0047AB; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
                                Login as Admin
                            </button>
                        </div>
                    </main>
                    
                    <footer style="margin-top: 20px; text-align: center; color: #666;">
                        <p>Job Selection System - Local Standalone Version</p>
                        <p>© 2025 Transportation Company</p>
                    </footer>
                </div>
            `;
            
            // Hide fallback content as we've successfully loaded
            const fallbackContent = document.getElementById('fallback-content');
            if (fallbackContent) {
                fallbackContent.style.display = 'none';
            }
            
            // Add event listeners
            setupEventListeners();
            
            console.log("Application UI rendered successfully");
        } else {
            console.error("Root element not found");
        }
    } catch (error) {
        console.error("Error initializing application:", error);
        // Show error in fallback content
        const errorDetails = document.getElementById('error-details');
        if (errorDetails) {
            errorDetails.textContent = error.message || "Unknown error initializing application";
        }
    }
});

// Set up basic interactivity
function setupEventListeners() {
    // Handle login type selection
    const loginTypeSelect = document.getElementById('login-type');
    if (loginTypeSelect) {
        loginTypeSelect.addEventListener('change', function() {
            const driverForm = document.getElementById('driver-login-form');
            const adminForm = document.getElementById('admin-login-form');
            
            if (this.value === 'driver') {
                driverForm.style.display = 'block';
                adminForm.style.display = 'none';
            } else {
                driverForm.style.display = 'none';
                adminForm.style.display = 'block';
            }
        });
    }
    
    // Driver login button
    const driverLoginBtn = document.getElementById('driver-login-btn');
    if (driverLoginBtn) {
        driverLoginBtn.addEventListener('click', function() {
            const employeeId = document.getElementById('employee-id').value;
            if (employeeId && employeeId.length === 7 && employeeId.startsWith('1')) {
                alert('Driver login successful! In a fully built application, you would now see the driver portal.');
            } else {
                alert('Please enter a valid 7-digit employee ID starting with 1');
            }
        });
    }
    
    // Admin login button
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function() {
            const password = document.getElementById('admin-password').value;
            if (password === 'ups123') {
                alert('Admin login successful! In a fully built application, you would now see the admin portal.');
            } else {
                alert('Incorrect admin password');
            }
        });
    }
}

// This simplified version demonstrates basic functionality
// A full build would include complete React application code

// Display a message explaining that this is a placeholder
window.onload = function() {
  const root = document.getElementById("root");
  
  root.innerHTML = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      <div style="background-color: #002F5F; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin-top: 0;">Job Selection System</h1>
        <p>This is a placeholder for the built application</p>
      </div>

      <div style="background-color: #fffde7; padding: 15px; border-left: 4px solid #ffeb3b; margin: 20px 0;">
        <strong>Note:</strong> You are seeing this message because you're viewing the placeholder version of the application.
      </div>

      <h2>How to get the fully built application:</h2>
      <ol style="line-height: 1.6;">
        <li>Find someone with Node.js installed</li>
        <li>Ask them to run the following commands in the project directory:
          <pre style="background-color: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto;">npm install
npm run build</pre>
        </li>
        <li>The <code>dist</code> folder will contain the fully built application</li>
        <li>Open the <code>index.html</code> file in that folder to use the application</li>
      </ol>

      <p>Alternatively, request a pre-built version of this application from your administrator.</p>

      <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0;">
        Once properly built, this application will work completely offline with no coding required.
      </div>
    </div>
  `;
};