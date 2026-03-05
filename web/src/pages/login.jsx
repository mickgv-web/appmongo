import { useState } from "react"

const API = "http://localhost:3000"

export default function Login({ onLogin }) {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  async function handleLogin(e) {
    e.preventDefault()

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
  }

  return (
    <div style={{maxWidth: "400px"}}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>

        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br/><br/>

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br/><br/>

        <button type="submit">
          Login
        </button>

      </form>

      <p>{message}</p>
    </div>
  )
}