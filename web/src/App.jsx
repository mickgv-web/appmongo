import { useState } from "react"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"

function App() {

  const [token, setToken] = useState(localStorage.getItem("token"))

  function handleLogin(token) {
    localStorage.setItem("token", token)
    setToken(token)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    setToken(null)
  }

  if (!token) {
    return <Login onLogin={setToken} />
  }

  return <Dashboard token={token} onLogout={handleLogout} />
}

export default App