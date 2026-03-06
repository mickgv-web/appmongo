import { useState } from "react"
import Sidebar from "../components/Sidebar"

const API = import.meta.env.VITE_API_URL || "http://localhost:3000"

export default function Login({ onLogin }) {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {

    e.preventDefault()

    setMessage("")
    setLoading(true)

    try {

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || "Login failed")
        return
      }

      onLogin(data.token)

    } catch {

      setMessage("Cannot reach API")

    } finally {

      setLoading(false)

    }

  }

  return (

    <div className="app">

      <Sidebar />

      <div className="main">

        {/* TOPBAR */}

        <div className="topbar">

          <div className="topbar-title">
            Login
          </div>

        </div>

        {/* LOGIN CARD */}

        <div
          className="card"
          style={{ maxWidth: "420px" }}
        >

          <form
            onSubmit={handleLogin}
            className="search-bar"
            style={{ flexDirection: "column" }}
          >

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Login"}
            </button>

          </form>

          {message && (
            <div
              className="meta"
              style={{ marginTop: "12px", color: "#f87171" }}
            >
              {message}
            </div>
          )}

        </div>

      </div>

    </div>

  )

}